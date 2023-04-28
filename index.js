const axios = require("axios");
const fs = require("fs");
const XLSX = require("xlsx");

const oktoUrl = "https://api.okto.shop/v1/products/";
const vtexUrl = "https://jumbocolombiaio.myvtex.com/api/catalog_system/pvt/sku/stockkeepingunitbyean/";

const oktoHeaders = {
  "x-auth-token": "nvRInzfkPqBPNd21SISfopq5uhtd4FKTFjocN5Hjq4zoV8laegt2k5Zwmj92ySHlZKqfbpAXoVRiP0e8n2K8VClmAH5YPYTQavVTplnRjSCftbEpoEwiYBMJurO1yEqH",
};


const vtexHeaders = {  
  "Accept": "application/json",
  "Content-Type": "application/json",
  "X-VTEX-API-AppKey": "",
  "X-VTEX-API-AppToken": ""
};

async function getProductsIndex() {
  const { data } = await axios.get(oktoUrl, { headers: oktoHeaders });
  return data.response.products_list.map(({ product_id }) => product_id);
}

async function getProductDataByIndex(productId) {
  try {
    const { data } = await axios.get(oktoUrl + productId, { headers: oktoHeaders });
    return data.response;
  } catch (error) {
    console.error(`Error obteniendo información del producto con ID ${productId}:`, error);
    return null;
  }
}

async function getProductInfo() {
  const productIds = await getProductsIndex();
  const productInfo = await Promise.all(productIds.map(getProductDataByIndex));
  return productInfo.filter((product) => product !== null);
}

async function getProductEanList() {
  const products = await getProductInfo();
  const eanList = products.map((product) => product.product_ean);
  return eanList;
}



async function getProductStockByEanList(eanList) {
  const promises = eanList.map(async (ean) => {
    const requestUrl = `${vtexUrl}${ean}` 
    try {
      const { data } = await axios.get(requestUrl, { vtexHeaders });
      return { "ean-ok-to-shop":ean, "vtex-product-id":data.ProductId };
    } catch (error) {
      console.error(
        `Error obteniendo stock del producto con EAN ${ean}:`,
        error
      );
      return null; // retornamos null para indicar que hubo un error
    }
  });
  const responses = await Promise.all(promises);
  return responses.filter((response) => response !== null); // filtramos los elementos que son null (hubo un error)
}

// async function getProductStockByEanList(eanList) {
//   const stockList = [];

//   for (const ean of eanList) {
//     const requestUrl = `${vtexUrl}${ean}`;

//     try {
//       const { data } = await axios.get(requestUrl, { vtexHeaders });
//       const stockData = { "ean-ok-to-shop": ean, "vtex-product-id": data.ProductId };
//       stockList.push(stockData);
//     } catch (error) {
//       console.error(`Error obteniendo stock del producto con EAN ${ean}:`, error);
//     }
//   }

//   return stockList;
// }


async function saveToExcel(productInfo, stockList) {
  const workbook = XLSX.utils.book_new();
  
  // Hoja para información de productos
  const productWorksheet = XLSX.utils.json_to_sheet(productInfo);
  XLSX.utils.book_append_sheet(workbook, productWorksheet, "Productos");
  
  // Hoja para información de stock
  const stockWorksheet = XLSX.utils.json_to_sheet(stockList);
  XLSX.utils.book_append_sheet(workbook, stockWorksheet, "Stock");
  
  const fileName = "productos.xlsx";
  XLSX.writeFile(workbook, fileName);
  console.log(`Se ha guardado el archivo ${fileName} exitosamente.`);
}

(async () => {
 // guardar productos en Excel
 const productInfo = await getProductInfo();
  
 // consultar stock por EAN en Vtex
 const eanList = await getProductEanList();
 const stockList = await getProductStockByEanList(eanList);
 
 // guardar en el archivo Excel
 await saveToExcel(productInfo, stockList);
})();

