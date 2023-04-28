const axios = require("axios");
const fs = require("fs");
const XLSX = require("xlsx");

const url = "https://api.okto.shop/v1/products/";

const headers = {
  "x-auth-token":
    "",
};

async function getProductsIndex() {
  const { data } = await axios.get(url, { headers });
  return data.response.products_list.map(({ product_id }) => product_id);
}

const getProductDataByIndex = async (productId) => {
  const newUrl = `${url}${productId}`;
  try {
    const { data } = await axios.get(newUrl, { headers });
    return data.response;
  } catch (error) {
    console.log(error);
  }
};

async function getProductInfo() {
  const productIds = await getProductsIndex();
  const productInfo = await Promise.all(productIds.map(getProductDataByIndex));
  return productInfo;
}

async function saveToExcel(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
  const fileName = "productos.xlsx";
  XLSX.writeFile(workbook, fileName);
  console.log(`Se ha guardado el archivo ${fileName} exitosamente.`);
}

async function getProductEanList() {
  const products = await getProductInfo();
  const eanList = products.map((product) => product.product_ean);
  return eanList;
}

const accountName = "tu_account_name";
const environment = "tu_environment";
const apiKey = "tu_api_key";
const apiToken = "tu_api_token";

const urlVtex = `https://${accountName}.${environment}.com.br/api/catalog_system/pvt/sku/stockkeepingunitbyean/`;

const headersVtex = {
  "Content-Type": "application/json",
  "X-VTEX-API-AppKey": apiKey,
  "X-VTEX-API-AppToken": apiToken,
};

async function getProductStockByEanList(eanList) {
  const promises = eanList.map(async (ean) => {
    const requestUrl = `${urlVtex}${ean}` 
    try {
      const { data } = await axios.get(requestUrl, { headersVtex });
      return data;
    } catch (error) {
      console.error(
        `Error obteniendo stock del producto con EAN ${ean}:`,
        error
      );
    }
  });
  const responses = await Promise.all(promises);
  return responses;
}

// Ejemplo de uso
(async () => {
  //gravar productos en exel
  const productInfo = await getProductInfo();
  await saveToExcel(productInfo);

  //consultas por ean a vtex
  const eanList = await getProductEanList();
  const stockList = await getProductStockByEanList(eanList);
  console.log(stockList);
})();