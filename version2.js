const axios = require("axios");
const fs = require("fs");
const XLSX = require("xlsx");

const oktoUrl = "https://api.okto.shop/v1/products/";

const oktoHeaders = {
  "x-auth-token": "",
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
    // console.error(`Error obteniendo información del producto con ID ${productId}:`, error);
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


async function productVtexByEanListOkToShop(eanList) {

  const promises = eanList.map(async (ean) => {  
    const url = `https://jumbocolombiaio.vtexcommercestable.com.br/api/catalog_system/pvt/sku/stockkeepingunitbyean/${ean}`;
    const options = {
        headers: {
            'X-VTEX-API-AppKey': '',
            'X-VTEX-API-AppToken': ''
        }
    };

    try {
      // const { data } = await axios.get(requestUrl, { vtexHeaders });  
      const {data} = await axios.get(url, options);  
      return {'productId': data.ProductId,
              'eanOktoShop':ean  
              };
    } catch (error) {
      // console.error(
      //   `Error obteniendo stock del producto con EAN ${ean}:`,
      //   error
      // );
      return null; // retornamos null para indicar que hubo un error
    }
  });
  const responses = await Promise.all(promises);
  return responses.filter((response) => response !== null); // filtramos los elementos que son null (hubo un error)
}



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
//  const productInfo = await getProductInfo();
  
 // consultar stock por EAN en Vtex
 const eanList = await getProductEanList();
 const stockList = await productVtexByEanListOkToShop(eanList);

 console.log('los porductos vtex',stockList);


 
 // guardar en el archivo Excel
//  await saveToExcel(productInfo, stockList);
})();

