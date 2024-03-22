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

//gravar un solo exel y un solo libro

// async function saveToExcel(data) {
//   const worksheet = XLSX.utils.json_to_sheet(data);
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
//   const fileName = "productos.xlsx";
//   XLSX.writeFile(workbook, fileName);
//   console.log(`Se ha guardado el archivo ${fileName} exitosamente.`);
// }

async function saveToExcel(products, nutritionalInfo) {
  const productWorksheet = XLSX.utils.json_to_sheet(products);
  const nutritionalWorksheet = XLSX.utils.json_to_sheet(nutritionalInfo);

  XLSX.writeFile(
    {
      Sheets: {
        Productos: productWorksheet,
        "Información Nutricional": nutritionalWorksheet,
      },
      SheetNames: ["Productos", "Información Nutricional"],
    },
    "productosv1.xlsx"
  );

  console.log("Se ha guardado el archivo productos.xlsx exitosamente.");
}


async function saveToJson(data) {
  const json = JSON.stringify(data);
  const fileName = "productos.json";
  fs.writeFile(fileName, json, "utf8", (err) => {
    if (err) {
      console.log(`Error al guardar el archivo ${fileName}: ${err}`);
    } else {
      console.log(`Se ha guardado el archivo ${fileName} exitosamente.`);
    }
  });
}

async function getProductEanList() {
  const products = await getProductInfo();
  const eanList = products.map((product) => product.product_ean);
  return eanList;
}

async function nutricionalTable() {
  try {
    const products = await getProductInfo();
    const nutricionalInfo = products.map((product) => {
      const table = product?.nutritional_tables_sets[0];
      if (table) {
        return {
          ean: product.product_ean,      
          portion_value: table.portion_value,
          num_portions: table.num_portions,
          energy_value_per_portion: table.energy_value_per_portion,
          protein_value_per_portion: table.protein_value_per_portion,
          fat_total_value_per_portion: table.fat_total_value_per_portion,
          carb_value_per_portion: table.carb_value_per_portion,
          sugars_value_per_portion: table.sugars_value_per_portion,
          sodium_value_per_portion: table.sodium_value_per_portion,
        };
      } else {
        console.log(`No se encontró información nutricional para el producto ${product.product_ean}`);
        return null;
      }
    }).filter(info => info !== null);
    console.log("nutricionalInfo", nutricionalInfo);
    return nutricionalInfo;
  } catch (error) {
    console.error("Error al obtener la información nutricional de los productos", error);
    throw error;
  }
}


//ejemplo de uso

(async () => {
  const products = await getProductInfo();
  const productsForExcel = products.map((product) => {
    return {
      product_ean: product.product_ean,
      product_id: product.product_id,
      product_ingredients: product.ingredients_sets_strings[0]?.ingredients,
      product_trace: product.traces_string,
      product_certificates: product.certificates
        .map((certificate) => certificate.certification_type_name)
        .toString(),
      product_warnings: product.warnings
        .map((warning) => warning.warning_code)
        .toString(),
    };
  });

  const nutritionalInfo = await nutricionalTable();

  await saveToExcel(productsForExcel, nutritionalInfo);
})();
