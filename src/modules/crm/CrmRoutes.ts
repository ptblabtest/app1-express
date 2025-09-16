import { routerFactory } from "@/utils/routerFactory";
import {
  contractService,
  leadService,
  opportunityService,
  quoteService,
} from "@/modules/crm/CrmService";

const leadRouter = routerFactory({
  basePath: "/leads",
  service: leadService,
  routes: {
    findMany: {},
    findOne: {},
  },
});

const opportunityRouter = routerFactory({
  basePath: "/opportunities",
  service: opportunityService,
  routes: {
    findMany: {},
    findOne: {},
  },
});

const quoteRouter = routerFactory({
  basePath: "/quotes",
  service: quoteService,
  routes: {
    findMany: {},
    findOne: {},
  },
});

const contractRouter = routerFactory({
  basePath: "/contracts",
  service: contractService,
  routes: {
    findMany: {},
    findOne: {},
  },
});

export { leadRouter, opportunityRouter, quoteRouter, contractRouter };
