import { routerFactory } from "@/utils/routerFactory";
import { requireRole } from "@/middlewares/auth";
import {
  clientService,
  vendorService,
  productService,
} from "./MasterService";

const clientRouter = routerFactory({
  basePath: "/clients",
  service: clientService,
  routes: {
    findMany: {},
    findOne: {},
    create: {},
    update: {},
  },
});

const vendorRouter = routerFactory({
  basePath: "/vendors",
  service: vendorService,
  routes: {
    findMany: {},
    findOne: {},
    create: {},
    update: {},
  },
});

const productRouter = routerFactory({
  basePath: "/products",
  service: productService,
  routes: {
    findMany: {},
    findOne: {},
    create: {},
    update: {},
  },
});

export { clientRouter, vendorRouter, productRouter };
