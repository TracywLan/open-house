const formatterCurrency = (num, currency = "USD") => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: currency,
  minimumFractionDigits: 2,
}).format(num);


module.exports = formatterCurrency