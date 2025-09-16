import argon2 from "argon2";

export async function seedRoles(prisma: any) {
  try {
    const existingRolesCount = await prisma.role.count();
    if (existingRolesCount === 0) {
      console.log("Role table is empty. Proceeding with initial seed...");
    } else {
      console.log(
        `Found ${existingRolesCount} existing roles. Adding missing ones only...`
      );
    }

    const rolesToSeed = [
      { name: "superadmin", level: 1 },
      { name: "leader", level: 2 },
      { name: "manager", level: 3 },
      { name: "user", level: 4 },
      { name: "guest", level: 5 },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const roleData of rolesToSeed) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (existingRole) {
        console.log(` ⏭️ Role already exists: ${roleData.name}`);
        skippedCount++;
      } else {
        await prisma.role.create({
          data: roleData,
        });
        console.log(` ✅ Created role: ${roleData.name}`);
        createdCount++;
      }
    }

    console.log(
      `Seeded roles: ${createdCount} created, ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
}

export async function seedUsers(prisma: any) {
  try {
    // Check if any users exist
    const existingUsersCount = await prisma.user.count();
    if (existingUsersCount === 0) {
      // No users - truncate for clean state
      await prisma.user.deleteMany();
      console.log("Truncated User table");
    } else {
      console.log(
        `Found ${existingUsersCount} existing users. Adding missing users only...`
      );
    }

    const usersToSeed = [
      {
        username: "superadmin@test.com",
        password: await argon2.hash("P@ssw0rd"),
        roleName: "superadmin",
        profile: {
          name: "Administrator",
        },
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of usersToSeed) {
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username },
      });

      if (existingUser) {
        console.log(` ⏭️ User already exists: ${userData.username}`);
        skippedCount++;
      } else {
        // Find role
        const role = await prisma.role.findUnique({
          where: { name: userData.roleName },
        });

        if (!role) {
          console.log(` ❌ Skipping ${userData.username}: Role not found`);
          continue;
        }

        await prisma.user.create({
          data: {
            username: userData.username,
            password: userData.password,
            roleId: role.id,
            profile: {
              create: userData.profile,
            },
          },
        });
        console.log(` ✅ Created user: ${userData.username}`);
        createdCount++;
      }
    }

    console.log(
      `Seeded users: ${createdCount} created, ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}
