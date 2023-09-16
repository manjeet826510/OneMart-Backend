import express from "express";
import Product from "../models/productModel.js";
import expressAsyncHandler from "express-async-handler";
import { isAdmin, isAuth } from "../utils.js";

const productRouter = express.Router();

productRouter.get("/", async (req, res) => {
  const products = await Product.find();
  // console.log(products);
  res.send(products);
});

productRouter.post(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    // const prodInfo = {nae, slug, image, brand, category, description, price, countInStock};
    console.log(`name = ${req.body.name}`);
    const newProduct = new Product({
      name: req.body.name,
      slug: req.body.slug,
      image: req.body.image,
      brand: req.body.brand,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      countInStock: req.body.countInStock,
      rating: 0,
      numReviews: 0,
    });
    console.log(newProduct);

    const product = await newProduct.save();

    res.send(product);
  })
);

const PAGE_SIZE = 3;

productRouter.get("/admin", isAuth, isAdmin, async (req, res) => {
  // console.log(req.query);
  const pageSize = req.query.pageSize || PAGE_SIZE;
  const page = req.query.page || 1;

  const products = await Product.find()
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  // console.log(products);
  // console.log(products);
  const countProducts = await Product.countDocuments(); //4
  // console.log(countProducts);
  // console.log(pageSize);
  res.send({ products, page, pages: Math.ceil(countProducts / pageSize) });
});

productRouter.get(
  "/search",
  expressAsyncHandler(async (req, res) => {
    // search?category=all&query=nike&price=all&rating=all&order=newest&page=1
    // await axios.get(
    // `/api/products/search?page=${page}&query=${query}&category=${category}&price=${price}&rating=${rating}&order=${order}`
    // )
    // req : {
    //   query:{
    //     page=${page},
    //     query=${query},
    //     category=${category},
    //     price=${price},
    //     rating=${rating},
    //     order=${order}
    //   }
    // }
    console.log(req);

    const { query } = req;

    const category = query.category || "";
    const searchQuery = query.query || "";
    const price = query.price || "";
    const rating = query.rating || "";
    const order = query.order || "";
    const page = query.page || 1;

    console.log(`searchQuery = ${searchQuery}`);

    const pageSize = query.pageSize || PAGE_SIZE;

    const queryFilter =
      searchQuery && searchQuery !== "all"
        ? {
            name: {
              $regex: searchQuery, //searchQuery = Shirts || nike
              $options: "i", // i = case insensitive
            },
          }
        : {}; //putting {} disables the queryFilter

    const categoryFilter = category && category !== "all" ? { category } : {};

    const ratingFilter =
      rating && rating !== "all"
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};

    const priceFilter =
      price && price !== "all"
        ? {
            // 51-200
            price: {
              // price.split("-") return array of size 2 here a = [51, 200] , a[0] = 61 , a[1] = 200
              $gte: Number(price.split("-")[0]),
              $lte: Number(price.split("-")[1]),
            },
          }
        : {};

    const sortOrder =
      // <option value="newest">Newest Arrivals</option>
      // <option value="lowest">Price: Low to High</option>
      // <option value="highest">Price: High to Low</option>
      // <option value="toprated">Avg. Customer Reviews</option>

      // order ===
      //   "featured"
      //   ? { featured: -1 }
      //   :

      order === "lowest"
        ? { price: 1 }
        : // let order === "lowest" sortOrder={price: 1}
        order === "highest"
        ? { price: -1 }
        : order === "toprated"
        ? { rating: -1 }
        : order === "newest"
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      // products = [{}, {}, {}, {}, ...]
      // console.log(products);
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  "/categories",
  expressAsyncHandler(async (req, res) => {
    const categories = await Product.find().distinct("category");
    res.send(categories);
  })
);

productRouter.get("/slug/:slug", async (req, res) => {
  // console.log(req.params);
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product Not Found" });
  }
});
productRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    // console.log(req.params);
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

productRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    // console.log(req.body);
    // console.log(req.params.id);
    const product = await Product.findById(req.params.id);
    // console.log(product);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.image = req.body.image;
      product.brand = req.body.brand;
      product.category = req.body.category;
      product.description = req.body.description;
      product.price = req.body.price;
      product.countInStock = req.body.countInStock;

      const updatedProduct = await product.save();
      console.log(updatedProduct);
      res.send({
        _id: updatedProduct._id,
        name: updatedProduct.name,
        slug: updatedProduct.slug,
        image: updatedProduct.image,
        brand: updatedProduct.brand,
        category: updatedProduct.category,
        description: updatedProduct.description,
        price: updatedProduct.price,
        countInStock: updatedProduct.countInStock,
        rating: updatedProduct.rating,
        numReviews: updatedProduct.numReviews,
      });
    } else {
      res.status(404).send({ message: "Product not found" });
    }
  })
);
productRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    // console.log(req.body);
    // console.log(req.params.id);
    const result = await Product.deleteOne({ _id: req.params.id });
    if (result.deletedCount > 0) {
      console.log("Product deleted successfully");
      res.send(result);
      // Additional logic after successful deletion
    } else {
      res.status(404).send({ message: "Product not found" });
    }
  })
);

export default productRouter;
