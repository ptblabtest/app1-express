export async function seedCategories(prisma: any) {
  try {
    // Check if any categories exist
    const existingCategoriesCount = await prisma.category.count();

    if (existingCategoriesCount === 0) {
      // No categories - truncate for clean state
      await prisma.category.deleteMany();
      console.log("Truncated Category table");
    } else {
      console.log(
        `Found ${existingCategoriesCount} existing categories. Adding missing categories only...`
      );
    }

    const categories = [
      {
        key: "legal",
        values: [
          { value: "PT", label: "PT" },
          { value: "CV", label: "CV" },
          { value: "Koperasi", label: "Koperasi" },
          { value: "Yayasan", label: "Yayasan" },
          { value: "Perkumpulan", label: "Perkumpulan" },
        ],
      },
      {
        key: "companyCategory",
        values: [
          { value: "Corporate", label: "Corporate" },
          { value: "NGO", label: "NGO" },
          { value: "Government", label: "Government" },
          { value: "BUMN", label: "BUMN" },
          { value: "BUMD", label: "BUMD" },
        ],
      },
      {
        key: "events",
        values: [
          { value: "Meeting", label: "Meeting" },
          { value: "Training", label: "Training" },
        ],
      },
      {
        key: "leadSource",
        values: [
          { value: "Cold Call", label: "Cold Call" },
          { value: "Existing Customer", label: "Existing Customer" },
          { value: "Self Generated", label: "Self Generated" },
          { value: "Employee", label: "Employee" },
          { value: "Partner", label: "Partner" },
          { value: "Public Relations", label: "Public Relations" },
          { value: "Direct Mail", label: "Direct Mail" },
          { value: "Conference", label: "Conference" },
          { value: "Trade Show", label: "Trade Show" },
          { value: "Web Site", label: "Web Site" },
          { value: "Customer Portal", label: "Customer Portal" },
          { value: "Word of mouth", label: "Word of mouth" },
          { value: "Email", label: "Email" },
          { value: "Other", label: "Other" },
          { value: "Subscription", label: "Subscription" },
        ],
      },
      {
        key: "currency",
        values: [
          { value: "IDR", label: "IDR" },
          { value: "USD", label: "USD" },
          { value: "EUR", label: "EUR" },
          { value: "GBP", label: "GBP" },
          { value: "CAD", label: "CAD" },
          { value: "AUD", label: "AUD" },
          { value: "JPY", label: "JPY" },
          { value: "KRW", label: "KRW" },
          { value: "MYR", label: "MYR" },
          { value: "SGD", label: "SGD" },
          { value: "THB", label: "THB" },
        ],
      },
      {
        key: "country",
        values: [
          { value: "Afghanistan", label: "Afghanistan" },
          { value: "Albania", label: "Albania" },
          { value: "Algeria", label: "Algeria" },
          { value: "Andorra", label: "Andorra" },
          { value: "Angola", label: "Angola" },
          { value: "Antigua and Barbuda", label: "Antigua and Barbuda" },
          { value: "Argentina", label: "Argentina" },
          { value: "Armenia", label: "Armenia" },
          { value: "Australia", label: "Australia" },
          { value: "Austria", label: "Austria" },
          { value: "Azerbaijan", label: "Azerbaijan" },
          { value: "Bahamas", label: "Bahamas" },
          { value: "Bahrain", label: "Bahrain" },
          { value: "Bangladesh", label: "Bangladesh" },
          { value: "Barbados", label: "Barbados" },
          { value: "Belarus", label: "Belarus" },
          { value: "Belgium", label: "Belgium" },
          { value: "Belize", label: "Belize" },
          { value: "Benin", label: "Benin" },
          { value: "Bhutan", label: "Bhutan" },
          { value: "Bolivia", label: "Bolivia" },
          { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" },
          { value: "Botswana", label: "Botswana" },
          { value: "Brazil", label: "Brazil" },
          { value: "Brunei", label: "Brunei" },
          { value: "Bulgaria", label: "Bulgaria" },
          { value: "Burkina Faso", label: "Burkina Faso" },
          { value: "Burundi", label: "Burundi" },
          { value: "Cabo Verde", label: "Cabo Verde" },
          { value: "Cambodia", label: "Cambodia" },
          { value: "Cameroon", label: "Cameroon" },
          { value: "Canada", label: "Canada" },
          {
            value: "Central African Republic",
            label: "Central African Republic",
          },
          { value: "Chad", label: "Chad" },
          { value: "Chile", label: "Chile" },
          { value: "China", label: "China" },
          { value: "Colombia", label: "Colombia" },
          { value: "Comoros", label: "Comoros" },
          { value: "Congo", label: "Congo" },
          { value: "Costa Rica", label: "Costa Rica" },
          { value: "Croatia", label: "Croatia" },
          { value: "Cuba", label: "Cuba" },
          { value: "Cyprus", label: "Cyprus" },
          { value: "Czech Republic", label: "Czech Republic" },
          {
            value: "Democratic Republic of the Congo",
            label: "Democratic Republic of the Congo",
          },
          { value: "Denmark", label: "Denmark" },
          { value: "Djibouti", label: "Djibouti" },
          { value: "Dominica", label: "Dominica" },
          { value: "Dominican Republic", label: "Dominican Republic" },
          { value: "Ecuador", label: "Ecuador" },
          { value: "Egypt", label: "Egypt" },
          { value: "El Salvador", label: "El Salvador" },
          { value: "Equatorial Guinea", label: "Equatorial Guinea" },
          { value: "Eritrea", label: "Eritrea" },
          { value: "Estonia", label: "Estonia" },
          { value: "Eswatini", label: "Eswatini" },
          { value: "Ethiopia", label: "Ethiopia" },
          { value: "Fiji", label: "Fiji" },
          { value: "Finland", label: "Finland" },
          { value: "France", label: "France" },
          { value: "Gabon", label: "Gabon" },
          { value: "Gambia", label: "Gambia" },
          { value: "Georgia", label: "Georgia" },
          { value: "Germany", label: "Germany" },
          { value: "Ghana", label: "Ghana" },
          { value: "Greece", label: "Greece" },
          { value: "Grenada", label: "Grenada" },
          { value: "Guatemala", label: "Guatemala" },
          { value: "Guinea", label: "Guinea" },
          { value: "Guinea-Bissau", label: "Guinea-Bissau" },
          { value: "Guyana", label: "Guyana" },
          { value: "Haiti", label: "Haiti" },
          { value: "Honduras", label: "Honduras" },
          { value: "Hungary", label: "Hungary" },
          { value: "Iceland", label: "Iceland" },
          { value: "India", label: "India" },
          { value: "Indonesia", label: "Indonesia" },
          { value: "Iran", label: "Iran" },
          { value: "Iraq", label: "Iraq" },
          { value: "Ireland", label: "Ireland" },
          { value: "Italy", label: "Italy" },
          { value: "Ivory Coast", label: "Ivory Coast" },
          { value: "Jamaica", label: "Jamaica" },
          { value: "Japan", label: "Japan" },
          { value: "Jordan", label: "Jordan" },
          { value: "Kazakhstan", label: "Kazakhstan" },
          { value: "Kenya", label: "Kenya" },
          { value: "Kiribati", label: "Kiribati" },
          { value: "Kuwait", label: "Kuwait" },
          { value: "Kyrgyzstan", label: "Kyrgyzstan" },
          { value: "Laos", label: "Laos" },
          { value: "Latvia", label: "Latvia" },
          { value: "Lebanon", label: "Lebanon" },
          { value: "Lesotho", label: "Lesotho" },
          { value: "Liberia", label: "Liberia" },
          { value: "Libya", label: "Libya" },
          { value: "Liechtenstein", label: "Liechtenstein" },
          { value: "Lithuania", label: "Lithuania" },
          { value: "Luxembourg", label: "Luxembourg" },
          { value: "Madagascar", label: "Madagascar" },
          { value: "Malawi", label: "Malawi" },
          { value: "Malaysia", label: "Malaysia" },
          { value: "Maldives", label: "Maldives" },
          { value: "Mali", label: "Mali" },
          { value: "Malta", label: "Malta" },
          { value: "Marshall Islands", label: "Marshall Islands" },
          { value: "Mauritania", label: "Mauritania" },
          { value: "Mauritius", label: "Mauritius" },
          { value: "Mexico", label: "Mexico" },
          { value: "Micronesia", label: "Micronesia" },
          { value: "Moldova", label: "Moldova" },
          { value: "Monaco", label: "Monaco" },
          { value: "Mongolia", label: "Mongolia" },
          { value: "Montenegro", label: "Montenegro" },
          { value: "Morocco", label: "Morocco" },
          { value: "Mozambique", label: "Mozambique" },
          { value: "Myanmar", label: "Myanmar" },
          { value: "Namibia", label: "Namibia" },
          { value: "Nauru", label: "Nauru" },
          { value: "Nepal", label: "Nepal" },
          { value: "Netherlands", label: "Netherlands" },
          { value: "New Zealand", label: "New Zealand" },
          { value: "Nicaragua", label: "Nicaragua" },
          { value: "Niger", label: "Niger" },
          { value: "Nigeria", label: "Nigeria" },
          { value: "North Korea", label: "North Korea" },
          { value: "North Macedonia", label: "North Macedonia" },
          { value: "Norway", label: "Norway" },
          { value: "Oman", label: "Oman" },
          { value: "Pakistan", label: "Pakistan" },
          { value: "Palau", label: "Palau" },
          { value: "Palestine", label: "Palestine" },
          { value: "Panama", label: "Panama" },
          { value: "Papua New Guinea", label: "Papua New Guinea" },
          { value: "Paraguay", label: "Paraguay" },
          { value: "Peru", label: "Peru" },
          { value: "Philippines", label: "Philippines" },
          { value: "Poland", label: "Poland" },
          { value: "Portugal", label: "Portugal" },
          { value: "Qatar", label: "Qatar" },
          { value: "Romania", label: "Romania" },
          { value: "Russia", label: "Russia" },
          { value: "Rwanda", label: "Rwanda" },
          { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis" },
          { value: "Saint Lucia", label: "Saint Lucia" },
          {
            value: "Saint Vincent and the Grenadines",
            label: "Saint Vincent and the Grenadines",
          },
          { value: "Samoa", label: "Samoa" },
          { value: "San Marino", label: "San Marino" },
          { value: "Sao Tome and Principe", label: "Sao Tome and Principe" },
          { value: "Saudi Arabia", label: "Saudi Arabia" },
          { value: "Senegal", label: "Senegal" },
          { value: "Serbia", label: "Serbia" },
          { value: "Seychelles", label: "Seychelles" },
          { value: "Sierra Leone", label: "Sierra Leone" },
          { value: "Singapore", label: "Singapore" },
          { value: "Slovakia", label: "Slovakia" },
          { value: "Slovenia", label: "Slovenia" },
          { value: "Solomon Islands", label: "Solomon Islands" },
          { value: "Somalia", label: "Somalia" },
          { value: "South Africa", label: "South Africa" },
          { value: "South Korea", label: "South Korea" },
          { value: "South Sudan", label: "South Sudan" },
          { value: "Spain", label: "Spain" },
          { value: "Sri Lanka", label: "Sri Lanka" },
          { value: "Sudan", label: "Sudan" },
          { value: "Suriname", label: "Suriname" },
          { value: "Sweden", label: "Sweden" },
          { value: "Switzerland", label: "Switzerland" },
          { value: "Syria", label: "Syria" },
          { value: "Taiwan", label: "Taiwan" },
          { value: "Tajikistan", label: "Tajikistan" },
          { value: "Tanzania", label: "Tanzania" },
          { value: "Thailand", label: "Thailand" },
          { value: "Timor-Leste", label: "Timor-Leste" },
          { value: "Togo", label: "Togo" },
          { value: "Tonga", label: "Tonga" },
          { value: "Trinidad and Tobago", label: "Trinidad and Tobago" },
          { value: "Tunisia", label: "Tunisia" },
          { value: "Turkey", label: "Turkey" },
          { value: "Turkmenistan", label: "Turkmenistan" },
          { value: "Tuvalu", label: "Tuvalu" },
          { value: "Uganda", label: "Uganda" },
          { value: "Ukraine", label: "Ukraine" },
          { value: "United Arab Emirates", label: "United Arab Emirates" },
          { value: "United Kingdom", label: "United Kingdom" },
          { value: "United States", label: "United States" },
          { value: "Uruguay", label: "Uruguay" },
          { value: "Uzbekistan", label: "Uzbekistan" },
          { value: "Vanuatu", label: "Vanuatu" },
          { value: "Vatican City", label: "Vatican City" },
          { value: "Venezuela", label: "Venezuela" },
          { value: "Vietnam", label: "Vietnam" },
          { value: "Yemen", label: "Yemen" },
          { value: "Zambia", label: "Zambia" },
          { value: "Zimbabwe", label: "Zimbabwe" },
        ],
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
      for (const item of category.values) {
        // Check using composite unique key (key + value combination)
        const existingCategory = await prisma.category.findFirst({
          where: {
            key: category.key,
            value: item.value,
          },
        });

        if (existingCategory) {
          console.log(
            `  ⏭️  Category already exists: ${category.key} - ${item.value}`
          );
          skippedCount++;
        } else {
          await prisma.category.create({
            data: {
              key: category.key,
              value: item.value,
              label: item.label,
            },
          });
          console.log(`  ✅ Created category: ${category.key} - ${item.value}`);
          createdCount++;
        }
      }
    }

    console.log(
      `Seeded categories: ${createdCount} created, ${skippedCount} skipped`
    );
  } catch (error) {
    console.error("Error seeding categories:", error);
  }
}
