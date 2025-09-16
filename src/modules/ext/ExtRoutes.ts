import { routerFactory } from "@/utils/routerFactory";
import { eventService, noteService } from "./ExtService";

const noteRouter = routerFactory({
  basePath: "/notes",
  service: noteService,
  routes: {
    findMany: {},
    findOne: {},
    create: {},
    update: {},
  },
});

const eventRouter = routerFactory({
  basePath: "/events",
  service: eventService,
  routes: {
    findMany: {},
    findOne: {},
    create: {},
    update: {},
  },
});

export {  noteRouter, eventRouter };
