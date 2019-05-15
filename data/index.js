const SQL = require("sql-template-strings");

const findTaxiDate = date => {
  return SQL`
    SELECT 
      *,
      CAST(strftime("%d", pickup_date) AS INT) AS day 
    FROM taxi
    WHERE 
      day=${date}`;
};

const findUberDate = date => {
  return SQL`
    SELECT 
      *,
      CAST(strftime("%d", pickup_date) AS INT) AS day 
    FROM uber
    WHERE 
      day=${date}`;
};

module.exports = {
  findTaxiDate,
  findUberDate
};
