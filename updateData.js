const fs = require("fs");
const axios = require("axios");

function cargarJson(ruta) {
  fs.readFile(ruta, "utf8", (error, data) => {
    if (error) {
      console.error("Ocurrió un error al leer el archivo:", error);
      return;
    }
    try {
      const json = JSON.parse(data);

      // Función para procesar cada elemento del JSON con un retraso
      const procesarElementoConRetraso = (el, index) => {
        setTimeout(() => {
          let vtexId = el.ProductId;

          let certificates = el.certificates.map(
            (c) => c.certification_type_name
          );
          let ingredients = el.ingredients_sets_strings.map((ing) => {
            let ingredient = ing.ingredients;
            return ingredient.replace(/\s+/g, " ");
          });

          let trase = el.traces_string;
          let nTable = el.nutritional_tables_sets[0];

          let portion = nTable?.portion_value || "";
          let portionPerPackage = nTable?.num_portions || "";
          let energykCal = nTable?.energy_value_per_portion || "";
          let proteins = nTable?.protein_value_per_portion || "";
          let fatTotal = nTable?.fat_total_value_per_portion || "";
          let fatSat = nTable?.fat_sat_value_per_portion || "";
          let fatMonoSat = nTable?.fat_mono_value_per_portion || "";
          let fatPoliSat = nTable?.fat_poli_value_per_portion || "";
          let fatTrans = nTable?.fat_trans_value_per_portion || "";
          let fatCholesterol = nTable?.fat_cholesterol_value_per_portion || "";
          let carbValue = nTable?.carb_value_per_portion || "";
          let sugarsValue = nTable?.sugars_value_per_portion || "";
          let fiberValue = nTable?.fiber_value_per_portion || "";
          let sodiumValue = nTable?.sodium_value_per_portion || "";

          let bodyToSend = [
            {
              Value: certificates,
              Id: 1881,
            },
            {
              Value: ingredients,
              Id: 1861,
            },
            {
              Value: [portion.toString()],
              Id: 1866,
            },
            {
              Value: [portionPerPackage.toString()],
              Id: 1867,
            },
            {
              Value: [energykCal.toString()],
              Id: 1868,
            },
            {
              Value: [proteins.toString()],
              Id: 1869,
            },
            {
              Value: [fatTotal.toString()],
              Id: 1870,
            },
            {
              Value: [fatSat.toString()],
              Id: 1871,
            },
            {
              Value: [fatMonoSat.toString()],
              Id: 1872,
            },
            {
              Value: [fatPoliSat.toString()],
              Id: 1873,
            },
            {
              Value: [fatTrans.toString()],
              Id: 1874,
            },
            {
              Value: [fatCholesterol.toString()],
              Id: 1875,
            },
            {
              Value: [carbValue.toString()],
              Id: 1876,
            },
            {
              Value: [sugarsValue.toString()],
              Id: 1877,
            },
            {
              Value: [sodiumValue.toString()],
              Id: 1879,
            },
          ];

          const config = {
            headers: {
              "X-VTEX-API-AppKey": "",
              "X-VTEX-API-AppToken": "",
            },
          };

          axios
            .post(
              `https://jumbocolombiaio.vtexcommercestable.com.br/api/catalog_system/pvt/products/${vtexId}/specification`,
              bodyToSend,
              config
            )
            .then((response) => {
              console.log("Respuesta de la API:", response.data);
            })
            .catch((error) => {
              console.error("Error al hacer la petición a la API:", error);
            });
        }, index * 1000); // Introducir un retraso de 1 segundo entre cada solicitud
      };

      // Iterar sobre cada elemento del JSON y procesarlo con un retraso
      json.forEach((el, index) => {
        procesarElementoConRetraso(el, index);
      });
    } catch (error) {
      console.error("Ocurrió un error al parsear el archivo JSON:", error);
    }
  });
}

// Uso de la función
cargarJson("./productos.json");
