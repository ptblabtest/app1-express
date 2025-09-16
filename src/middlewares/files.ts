import prisma from "../lib/prisma";

export const saveFilesToDatabase = (modelField: string = "reportId") => {
  return async (req: any, res: any, next: any) => {
    try {
      req.saveFiles = async (entityId: string) => {
        if (!req.files || req.files.length === 0) return [];

        const filePromises = req.files.map((file: any) =>
          prisma.file.create({
            data: {
              url: file.location || file.path, // S3 URL or local path
              key: file.key || file.filename, // S3 key or filename
              [modelField]: entityId,
            },
          })
        );

        return await Promise.all(filePromises);
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};
