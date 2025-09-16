import prisma from "@/lib/prisma";
import { applyRegNumber } from "@/utils/mutation/regNumberGenerator";
import { prepareForView } from "@/utils/query/prepareForView";
import { z } from "zod";

const pipelineSchema = z.object({
  regNumber: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  opportunityId: z.string().optional().nullable(),
  quoteId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional().nullable(),
  mode: z
    .enum(["lead", "opportunity", "quote", "contract"])
    .optional()
    .nullable(),
  lead: z
    .object({
      regNumber: z.string().optional().nullable(),
      name: z.string().optional().nullable(),
      role: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      leadSource: z.string().optional().nullable(),
      leadDate: z.coerce.date().optional().nullable(),
      leadAddress: z.string().optional().nullable(),
      prospectLocation: z.string().optional().nullable(),
      remarks: z.string().optional().nullable(),
      dueDate: z.coerce.date().optional().nullable(),
      approvedDate: z.coerce.date().optional().nullable(),
      clientId: z.string().optional().nullable(),
      productIds: z.array(z.string()).optional().nullable(),
    })
    .optional()
    .nullable(),
  opportunity: z
    .object({
      regNumber: z.string().optional().nullable(),
      title: z.string().min(1, "Title is required"),
      currency: z.string().optional().nullable(),
      baseAmount: z.number().optional().nullable(),
      exchangeRate: z.number().optional().nullable(),
      amount: z.number().optional().nullable(),
      remarks: z.string().optional().nullable(),
      dueDate: z.coerce.date().optional().nullable(),
      approvedDate: z.coerce.date().optional().nullable(),
      clientId: z.string().optional().nullable(),
      leadId: z.string().optional().nullable(),
      productIds: z.array(z.string()).optional().nullable(),
    })
    .optional()
    .nullable(),
  quote: z
    .object({
      regNumber: z.string().optional().nullable(),
      title: z.string().min(1, "Title is required"),
      currency: z.string().optional().nullable(),
      baseAmount: z.number().optional().nullable(),
      exchangeRate: z.number().optional().nullable(),
      amount: z.number().optional().nullable(),
      remarks: z.string().optional().nullable(),
      dueDate: z.coerce.date().optional().nullable(),
      releasedDate: z.coerce.date().optional().nullable(),
      approvedDate: z.coerce.date().optional().nullable(),
      expiredDate: z.coerce.date().optional().nullable(),
      clientId: z.string().optional().nullable(),
      opportunityId: z.string().optional().nullable(),
      productIds: z.array(z.string()).optional().nullable(),
    })
    .optional()
    .nullable(),
  contract: z
    .object({
      regNumber: z.string().optional().nullable(),
      title: z.string().min(1, "Title is required"),
      currency: z.string().optional().nullable(),
      baseAmount: z.number().optional().nullable(),
      exchangeRate: z.number().optional().nullable(),
      amount: z.number().optional().nullable(),
      remarks: z.string().optional().nullable(),
      signedDate: z.coerce.date().optional().nullable(),
      startDate: z.coerce.date().optional().nullable(),
      endDate: z.coerce.date().optional().nullable(),
      penalty: z.boolean().optional().nullable(),
      clientPicName: z.string().optional().nullable(),
      clientId: z.string().optional().nullable(),
      quoteId: z.string().optional().nullable(),
      productIds: z.array(z.string()).optional().nullable(),
    })
    .optional()
    .nullable(),
  stage: z
    .object({
      stageTypeId: z.string(),
      comment: z.string().optional(),
    })
    .optional(),
  transition: z
    .object({
      action: z.enum(["PROGRESS", "REGRESS"]),
      targetStage: z.enum(["lead", "opportunity", "quote", "contract"]),
    })
    .optional(),
});

const PIPELINE_SELECT = {
  id: true,
  regNumber: true,
  category: true,
  leadId: true,
  opportunityId: true,
  quoteId: true,
  contractId: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  updatedById: true,
  assignee: {
    select: {
      id: true,
      username: true,
    },
  },
  members: {
    select: {
      id: true,
      username: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      username: true,
    },
  },
  updatedBy: {
    select: {
      id: true,
      username: true,
    },
  },
  stages: {
    select: {
      id: true,
      stageTypeId: true,
      comment: true,
      createdAt: true,
      type: {
        select: {
          id: true,
          model: true,
          order: true,
          value: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  lead: {
    select: {
      id: true,
      regNumber: true,
      name: true,
      role: true,
      email: true,
      phone: true,
      leadSource: true,
      leadDate: true,
      leadAddress: true,
      prospectLocation: true,
      remarks: true,
      dueDate: true,
      approvedDate: true,
      clientId: true,
      createdAt: true,
      updatedAt: true,
      client: true,
      products: true,
    },
  },
  opportunity: {
    select: {
      id: true,
      regNumber: true,
      title: true,
      currency: true,
      baseAmount: true,
      exchangeRate: true,
      amount: true,
      remarks: true,
      dueDate: true,
      approvedDate: true,
      clientId: true,
      leadId: true,
      createdAt: true,
      updatedAt: true,
      client: true,
      products: true,
    },
  },
  quote: {
    select: {
      id: true,
      regNumber: true,
      title: true,
      currency: true,
      baseAmount: true,
      exchangeRate: true,
      amount: true,
      remarks: true,
      dueDate: true,
      releasedDate: true,
      approvedDate: true,
      expiredDate: true,
      clientId: true,
      opportunityId: true,
      createdAt: true,
      updatedAt: true,
      client: true,
      products: true,
    },
  },
  contract: {
    select: {
      id: true,
      regNumber: true,
      title: true,
      currency: true,
      baseAmount: true,
      exchangeRate: true,
      amount: true,
      remarks: true,
      signedDate: true,
      startDate: true,
      endDate: true,
      penalty: true,
      clientPicName: true,
      clientId: true,
      quoteId: true,
      createdAt: true,
      updatedAt: true,
      client: true,
      products: true,
    },
  },
};

const transformPipeline = (pipeline: any) => {
  const prepared = prepareForView(pipeline);

  const transformEntity = (entity: any) => {
    if (!entity) return entity;

    const transformed = { ...entity };

    // Transform client to clientName
    if (entity.client) {
      transformed.clientName = entity.client.name || "";
    } else {
      transformed.clientName = "";
    }
    delete transformed.client;

    // Transform products to productNames and productIds
    if (entity.products && Array.isArray(entity.products)) {
      transformed.productNames = entity.products
        .map((product: any) => product.name)
        .join(", ");
      transformed.productIds = entity.products.map(
        (product: any) => product.id
      );
    } else {
      transformed.productNames = "";
      transformed.productIds = [];
    }

    delete transformed.products;

    return transformed;
  };
  return {
    ...prepared,
    lead: transformEntity(prepared.lead),
    opportunity: transformEntity(prepared.opportunity),
    quote: transformEntity(prepared.quote),
    contract: transformEntity(prepared.contract),
    hasLead: !!prepared.leadId,
    hasOpportunity: !!prepared.opportunityId,
    hasQuote: !!prepared.quoteId,
    hasContract: !!prepared.contractId,
    leadNumber: prepared.lead?.regNumber || null,
    opportunityNumber: prepared.opportunity?.regNumber || null,
    quoteNumber: prepared.quote?.regNumber || null,
    contractNumber: prepared.contract?.regNumber || null,
  };
};

// Validation helper
const validateProgression = (existingPipeline: any, newData: any) => {
  // Check if trying to create/update contract
  if (newData.contract) {
    if (!existingPipeline?.quoteId && !newData.quote) {
      throw new Error("Contract requires a Quote to exist");
    }
  }

  // Check if trying to create/update quote
  if (newData.quote) {
    if (!existingPipeline?.opportunityId && !newData.opportunity) {
      throw new Error("Quote requires an Opportunity to exist");
    }
  }
};

export const pipelineService = {
  create: async (data: any, user: any) => {
    const validatedData = await pipelineSchema.parseAsync(data);

    validateProgression(null, validatedData);

    if (!validatedData.category) {
      throw new Error("Category is required when creating a pipeline");
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Get the first stage type for pipeline model
      const firstStageType = await tx.stageType.findFirst({
        where: {
          model: "pipeline",
          order: 1,
        },
      });

      if (!firstStageType) {
        throw new Error("No initial stage type found for pipeline");
      }

      // Handle all entities
      const leadResult = await handleLead(tx, validatedData.lead);
      const opportunityResult = await handleOpportunity(
        tx,
        validatedData.opportunity,
        undefined,
        leadResult.id
      );
      const quoteResult = await handleQuote(
        tx,
        validatedData.quote,
        undefined,
        opportunityResult.id
      );
      const contractResult = await handleContract(
        tx,
        validatedData.contract,
        undefined,
        quoteResult.id
      );

      // Build stage comment from actions
      const createdEntities = [
        leadResult.action && `Lead ${leadResult.action}`,
        opportunityResult.action && `Opportunity ${opportunityResult.action}`,
        quoteResult.action && `Quote ${quoteResult.action}`,
        contractResult.action && `Contract ${contractResult.action}`,
      ].filter(Boolean);

      const stageComment =
        createdEntities.length > 0
          ? `Pipeline created - ${createdEntities.join(", ")}`
          : "Pipeline created";

      const regNumber = await applyRegNumber(
        "pipeline",
        validatedData.regNumber || undefined
      );

      const pipeline = await tx.pipeline.create({
        data: {
          regNumber: regNumber || validatedData.regNumber,
          category: validatedData.category,
          leadId: leadResult.id,
          opportunityId: opportunityResult.id,
          quoteId: quoteResult.id,
          contractId: contractResult.id,
          assigneeId: validatedData.assigneeId,
          createdById: user.id,
          members: validatedData.memberIds
            ? {
                connect: [...new Set(validatedData.memberIds)].map(
                  (id: string) => ({ id })
                ),
              }
            : undefined,
          stages: {
            create: {
              stageTypeId:
                validatedData.stage?.stageTypeId || firstStageType.id,
              comment: validatedData.stage?.comment || stageComment,
              createdById: user.id,
            },
          },
        },
        select: PIPELINE_SELECT,
      });

      return pipeline;
    });

    return transformPipeline(result);
  },
  update: async (id: string, data: any, user: any) => {
    const validatedData = await pipelineSchema.parseAsync(data);

    const existingPipeline = await prisma.pipeline.findUnique({
      where: { id },
      select: {
        leadId: true,
        opportunityId: true,
        quoteId: true,
        contractId: true,
        lead: {
          select: {
            name: true,
            clientId: true,
            products: { select: { id: true } },
          },
        },
        opportunity: {
          select: {
            title: true,
            clientId: true,
            currency: true,
            baseAmount: true,
            exchangeRate: true,
            amount: true,
            dueDate: true,
            remarks: true,
            products: { select: { id: true } },
          },
        },
        quote: {
          select: {
            title: true,
            clientId: true,
            currency: true,
            baseAmount: true,
            exchangeRate: true,
            amount: true,
            dueDate: true,
            remarks: true,
            products: { select: { id: true } },
          },
        },
      },
    });

    if (!existingPipeline) {
      throw new Error("Pipeline not found");
    }

    // Handle transition if provided
    if (validatedData.transition) {
      const { action, targetStage } = validatedData.transition;

      return await prisma.$transaction(async (tx: any) => {
        if (action === "PROGRESS") {
          await handleProgress(
            tx,
            existingPipeline,
            targetStage,
            validatedData
          );

          // Continue with normal update flow after modifying validatedData
          validateProgression(existingPipeline, validatedData);

          // Handle all entities
          const leadResult = await handleLead(
            tx,
            validatedData.lead,
            existingPipeline.leadId
          );
          const opportunityResult = await handleOpportunity(
            tx,
            validatedData.opportunity,
            existingPipeline.opportunityId,
            leadResult.id
          );
          const quoteResult = await handleQuote(
            tx,
            validatedData.quote,
            existingPipeline.quoteId,
            opportunityResult.id
          );
          const contractResult = await handleContract(
            tx,
            validatedData.contract,
            existingPipeline.contractId,
            quoteResult.id
          );

          // Update pipeline
          const pipeline = await tx.pipeline.update({
            where: { id },
            data: {
              updatedById: user.id,
              leadId: leadResult.id,
              opportunityId: opportunityResult.id,
              quoteId: quoteResult.id,
              contractId: contractResult.id,
              // stages: validatedData.stage ? {
              //   create: {
              //     stageTypeId: validatedData.stage.stageTypeId,
              //     comment: validatedData.stage.comment,
              //     createdById: user.id,
              //   },
              // } : undefined,
            },
            select: PIPELINE_SELECT,
          });

          return pipeline;
        } else if (action === "REGRESS") {
          const regressData = await handleRegress(
            tx,
            existingPipeline,
            targetStage
          );

          // Direct update for regression
          const pipeline = await tx.pipeline.update({
            where: { id },
            data: {
              ...regressData,
              updatedById: user.id,
              // stages: {
              //   create: {
              //     stageTypeId: regressData.stageTypeId,
              //     comment: regressData.stageComment,
              //     createdById: user.id,
              //   },
              // },
            },
            select: PIPELINE_SELECT,
          });

          return pipeline;
        }
      });
    }

    // Normal update flow (without transition)
    validateProgression(existingPipeline, validatedData);

    const result = await prisma.$transaction(async (tx: any) => {
      let leadResult: { id: any; action: null | string } = {
        id: existingPipeline.leadId,
        action: null,
      };
      let opportunityResult: { id: any; action: null | string } = {
        id: existingPipeline.opportunityId,
        action: null,
      };
      let quoteResult: { id: any; action: null | string } = {
        id: existingPipeline.quoteId,
        action: null,
      };
      let contractResult: { id: any; action: null | string } = {
        id: existingPipeline.contractId,
        action: null,
      };

      // Only update the entity specified by mode
      if (validatedData.mode) {
        switch (validatedData.mode) {
          case "lead":
            leadResult = await handleLead(
              tx,
              validatedData.lead,
              existingPipeline.leadId
            );
            break;
          case "opportunity":
            opportunityResult = await handleOpportunity(
              tx,
              validatedData.opportunity,
              existingPipeline.opportunityId,
              existingPipeline.leadId
            );
            break;
          case "quote":
            quoteResult = await handleQuote(
              tx,
              validatedData.quote,
              existingPipeline.quoteId,
              existingPipeline.opportunityId
            );
            break;
          case "contract":
            contractResult = await handleContract(
              tx,
              validatedData.contract,
              existingPipeline.contractId,
              existingPipeline.quoteId
            );
            break;
        }
      } else {
        // Update all entities if no mode specified (existing behavior)
        leadResult = await handleLead(
          tx,
          validatedData.lead,
          existingPipeline.leadId
        );
        opportunityResult = await handleOpportunity(
          tx,
          validatedData.opportunity,
          existingPipeline.opportunityId,
          leadResult.id
        );
        quoteResult = await handleQuote(
          tx,
          validatedData.quote,
          existingPipeline.quoteId,
          opportunityResult.id
        );
        contractResult = await handleContract(
          tx,
          validatedData.contract,
          existingPipeline.contractId,
          quoteResult.id
        );
      }

      let updateData: any = {
        updatedById: user.id,
        leadId: leadResult.id,
        opportunityId: opportunityResult.id,
        quoteId: quoteResult.id,
        contractId: contractResult.id,
      };

      if (validatedData.category) {
        updateData.category = validatedData.category;
      }

      if (validatedData.assigneeId !== undefined) {
        updateData.assigneeId = validatedData.assigneeId;
      }

      if (validatedData.memberIds) {
        updateData.members = {
          set: [...new Set(validatedData.memberIds)].map((id: string) => ({
            id,
          })),
        };
      }

      if (validatedData.stage) {
        updateData.stages = {
          create: {
            stageTypeId: validatedData.stage.stageTypeId,
            comment: validatedData.stage.comment,
            createdById: user.id,
          },
        };
      }

      const pipeline = await tx.pipeline.update({
        where: { id },
        data: updateData,
        select: PIPELINE_SELECT,
      });

      return pipeline;
    });

    return transformPipeline(result);
  },
  findMany: async (queryParams?: any) => {
    const pipelines = await prisma.pipeline.findMany({
      ...queryParams,
      select: PIPELINE_SELECT,
    });

    return pipelines.map((pipeline: any) => {
      const transformed = transformPipeline(pipeline);

      // Add flags for what exists
      const hasLead = !!transformed.leadId;
      const hasOpportunity = !!transformed.opportunityId;
      const hasQuote = !!transformed.quoteId;
      const hasContract = !!transformed.contractId;

      // Determine current stage (highest progression)
      let currentStage = "lead";
      if (transformed.contractId) currentStage = "contract";
      else if (transformed.quoteId) currentStage = "quote";
      else if (transformed.opportunityId) currentStage = "opportunity";

      // Remove earlier entities based on progression
      if (transformed.contractId) {
        delete transformed.lead;
        delete transformed.opportunity;
        delete transformed.quote;
      } else if (transformed.quoteId) {
        delete transformed.lead;
        delete transformed.opportunity;
      } else if (transformed.opportunityId) {
        delete transformed.lead;
      }

      // Remove the ID fields
      delete transformed.leadId;
      delete transformed.opportunityId;
      delete transformed.quoteId;
      delete transformed.contractId;

      return transformed;
    });
  },
  findUnique: async (id: string) => {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      select: PIPELINE_SELECT,
    });

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    return transformPipeline(pipeline);
  },
};

const handleLead = async (tx: any, data: any, id?: string) => {
  if (!data) return { id, action: null };

  // Create a copy and handle products separately
  const { productIds, ...leadData } = data;

  if (id) {
    // Update existing
    await tx.lead.update({
      where: { id },
      data: {
        ...leadData,
        products: productIds
          ? { set: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id, action: "updated" };
  } else {
    // Create new
    const regNumber = await applyRegNumber("lead", leadData.regNumber);
    const lead = await tx.lead.create({
      data: {
        ...leadData,
        regNumber: regNumber || leadData.regNumber,
        products: productIds
          ? { connect: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id: lead.id, action: "created" };
  }
};

const handleOpportunity = async (
  tx: any,
  data: any,
  id?: string,
  leadId?: string
) => {
  if (!data) return { id, action: null };

  const { productIds, ...opportunityData } = data;

  if (id) {
    await tx.opportunity.update({
      where: { id },
      data: {
        ...opportunityData,
        products: productIds
          ? { set: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id, action: "updated" };
  } else {
    const regNumber = await applyRegNumber(
      "opportunity",
      opportunityData.regNumber
    );
    const opportunity = await tx.opportunity.create({
      data: {
        ...opportunityData,
        regNumber: regNumber || opportunityData.regNumber,
        leadId,
        products: productIds
          ? { connect: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id: opportunity.id, action: "created" };
  }
};

const handleQuote = async (
  tx: any,
  data: any,
  id?: string,
  opportunityId?: string
) => {
  if (!data) return { id, action: null };

  const { productIds, ...quoteData } = data;

  if (id) {
    await tx.quote.update({
      where: { id },
      data: {
        ...quoteData,
        products: productIds
          ? { set: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id, action: "updated" };
  } else {
    const regNumber = await applyRegNumber("quote", quoteData.regNumber);
    const quote = await tx.quote.create({
      data: {
        ...quoteData,
        regNumber: regNumber || quoteData.regNumber,
        opportunityId,
        products: productIds
          ? { connect: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id: quote.id, action: "created" };
  }
};

const handleContract = async (
  tx: any,
  data: any,
  id?: string,
  quoteId?: string
) => {
  if (!data) return { id, action: null };

  const { productIds, ...contractData } = data;

  if (id) {
    await tx.contract.update({
      where: { id },
      data: {
        ...contractData,
        products: productIds
          ? { set: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id, action: "updated" };
  } else {
    const regNumber = await applyRegNumber("contract", contractData.regNumber);
    const contract = await tx.contract.create({
      data: {
        ...contractData,
        regNumber: regNumber || contractData.regNumber,
        quoteId,
        products: productIds
          ? { connect: productIds.map((id: string) => ({ id })) }
          : undefined,
      },
    });
    return { id: contract.id, action: "created" };
  }
};

const handleProgress = async (
  tx: any,
  existingPipeline: any,
  targetStage: string,
  validatedData: any
) => {
  // Get the appropriate stage type based on target
  // const stageTypeMap: any = {
  //   OPPORTUNITY: "opportunity",
  //   QUOTE: "quote",
  //   CONTRACT: "contract",
  // };

  // const stageType = await tx.stageType.findFirst({
  //   where: {
  //     model: "pipeline",
  //     value: stageTypeMap[targetStage] || targetStage.toLowerCase(),
  //   },
  // });

  // if (!stageType) {
  //   throw new Error(`No stage type found for ${targetStage}`);
  // }

  switch (targetStage) {
    case "opportunity":
      if (!existingPipeline.opportunityId) {
        if (!existingPipeline.leadId) {
          throw new Error("Cannot progress to Opportunity without Lead");
        }
        validatedData.opportunity = {
          title: `${existingPipeline.client?.name || "New Opportunity"}`,
          remarks: existingPipeline.lead?.remarks,
          productIds:
            existingPipeline.lead?.products?.map((p: any) => p.id) || [],
          clientId: existingPipeline.lead?.clientId,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };
      }
      break;

    case "quote":
      if (!existingPipeline.quoteId) {
        if (!existingPipeline.opportunityId) {
          throw new Error("Cannot progress to Quote without Opportunity");
        }
        validatedData.quote = {
          title: existingPipeline.opportunity?.title || "Quote",
          currency: existingPipeline.opportunity?.currency,
          baseAmount: existingPipeline.opportunity?.baseAmount,
          exchangeRate: existingPipeline.opportunity?.exchangeRate,
          amount: existingPipeline.opportunity?.amount,
          remarks: existingPipeline.opportunity?.remarks,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          productIds:
            existingPipeline.opportunity?.products?.map((p: any) => p.id) || [],
          clientId: existingPipeline.opportunity?.clientId,
        };
      }
      break;

    case "contract":
      if (!existingPipeline.contractId) {
        if (!existingPipeline.quoteId) {
          throw new Error("Cannot progress to Contract without Quote");
        }
        validatedData.contract = {
          title: existingPipeline.quote?.title || "Contract",
          currency: existingPipeline.quote?.currency,
          baseAmount: existingPipeline.quote?.baseAmount,
          exchangeRate: existingPipeline.quote?.exchangeRate,
          amount: existingPipeline.quote?.amount,
          remarks: existingPipeline.quote?.remarks,
          productIds:
            existingPipeline.quote?.products?.map((p: any) => p.id) || [],
          clientId: existingPipeline.quote?.clientId,
        };
      }
      break;

    case "lead":
      throw new Error("Cannot progress to Lead - it's the first stage");
  }

  // validatedData.stage = {
  //   stageTypeId: stageType.id,
  //   comment: `Progressed to ${targetStage}`,
  // };
};

const handleRegress = async (
  tx: any,
  existingPipeline: any,
  targetStage: string
) => {
  // Check if regression is allowed
  const entityCount = [
    existingPipeline.leadId,
    existingPipeline.opportunityId,
    existingPipeline.quoteId,
    existingPipeline.contractId,
  ].filter(Boolean).length;

  if (entityCount <= 1) {
    throw new Error("Cannot regress - pipeline must have at least one entity");
  }

  // Get the appropriate stage type
  // const stageTypeMap: any = {
  //   LEAD: "lead",
  //   OPPORTUNITY: "opportunity",
  //   QUOTE: "quote",
  // };

  // const stageType = await tx.stageType.findFirst({
  //   where: {
  //     model: "pipeline",
  //     value: stageTypeMap[targetStage] || targetStage.toLowerCase(),
  //   },
  // });

  // if (!stageType) {
  //   throw new Error(`No stage type found for ${targetStage}`);
  // }

  const regressData: any = {
    updatedById: null, // Will be set in the update method
    // stageTypeId: stageType.id,
    // stageComment: `Regressed to ${targetStage}`,
  };

  switch (targetStage) {
    case "quote":
      if (!existingPipeline.contractId) {
        throw new Error("Cannot regress to Quote - no Contract exists");
      }
      regressData.contractId = null;
      break;

    case "opportunity":
      if (!existingPipeline.quoteId) {
        throw new Error("Cannot regress to Opportunity - no Quote exists");
      }
      regressData.quoteId = null;
      regressData.contractId = null;
      break;

    case "lead":
      if (!existingPipeline.opportunityId) {
        throw new Error("Cannot regress to Lead - no Opportunity exists");
      }
      regressData.opportunityId = null;
      regressData.quoteId = null;
      regressData.contractId = null;
      break;

    case "contract":
      throw new Error("Cannot regress to Contract - it's the last stage");
  }

  return regressData;
};
