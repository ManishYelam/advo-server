const moment = require('moment');

module.exports = {
  formatDate: (date, format = 'YYYY-MM-DD') => {
    return moment(date).format(format);
  },

  addDays: (date, days) => {
    return moment(date).add(days, 'days').toDate();
  },

  isPastDate: date => {
    return moment().isAfter(date);
  },
};
