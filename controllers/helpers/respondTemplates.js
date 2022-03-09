const res200 = (res, data) => {
  res.set({
    "Content-Type": "application/vnd.api+json",
  });
  res.status(200);
  res.json(data);
};

module.exports = { res200 };
