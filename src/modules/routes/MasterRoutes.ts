import { clientService } from "@/modules/services/ClientService";
import { productService } from "@/modules/services/ProductService";
import { vendorService } from "@/modules/services/VendorService";
import { Router } from "express";

const router = Router();
router.get("/clients", async (req, res) => {
  const clients = await clientService.findMany(req.query);
  res.json({
    data: clients,
    meta: { total: clients.length },
  });
});

router.get("/clients/:id", async (req, res) => {
  const client = await clientService.findUnique(req.params.id);
  res.json({ data: client });
});

router.post("/clients", async (req, res) => {
  const client = await clientService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: client.id },
  });
});

router.patch("/clients/:id", async (req, res) => {
  const client = await clientService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: client.id },
  });
});

router.get("/vendors", async (req, res) => {
  const vendors = await vendorService.findMany(req.query);
  res.json({
    data: vendors,
    meta: { total: vendors.length },
  });
});

router.get("/vendors/:id", async (req, res) => {
  const vendor = await vendorService.findUnique(req.params.id);
  res.json({ data: vendor });
});

router.post("/vendors", async (req, res) => {
  const vendor = await vendorService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: vendor.id },
  });
});

router.patch("/vendors/:id", async (req, res) => {
  const vendor = await vendorService.update(req.params.id, req.body, req.user);
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: vendor.id },
  });
});

router.get("/products", async (req, res) => {
  const products = await productService.findMany(req.query);
  res.json({
    data: products,
    meta: { total: products.length },
  });
});

router.get("/products/:id", async (req, res) => {
  const product = await productService.findUnique(req.params.id);
  res.json({ data: product });
});

router.post("/products", async (req, res) => {
  const product = await productService.create(req.body, req.user);
  res.status(201).json({
    message: "Data created successfully",
    data: { id: product.id },
  });
});

router.patch("/products/:id", async (req, res) => {
  const product = await productService.update(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json({
    message: "Data updated successfully",
    data: { id: product.id },
  });
});

export default router;
