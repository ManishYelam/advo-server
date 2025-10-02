module.exports = {
  paginate: (model, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return {
      limit,
      offset,
      paginateData: data => ({
        data,
        currentPage: page,
        totalItems: model.length,
        totalPages: Math.ceil(model.length / limit),
      }),
    };
  },
};
