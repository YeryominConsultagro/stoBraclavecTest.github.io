  $(function () {
    $('#dateRangePicker').daterangepicker(
      {
        locale: {
          format: 'DD.MM.YYYY',
          separator: ' - ',
          applyLabel: 'Прийняти',
          cancelLabel: 'Відмінити',
          fromLabel: 'Від',
          toLabel: 'До',
          customRangeLabel: 'Свій діапазон',
          weekLabel: 'Тиж',
          daysOfWeek: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
          monthNames: [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
          ],
          firstDay: 1
        },
        opens: 'center',
        alwaysShowCalendars: true,
        autoUpdateInput: true,
        startDate: moment().subtract(29, 'days'),
        endDate: moment(),
        ranges: {
          'Сьогодні': [moment(), moment()],
          'Вчора': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
          'Останні 7 днів': [moment().subtract(6, 'days'), moment()],
          'Останні 30 днів': [moment().subtract(29, 'days'), moment()],
          'Поточний місяць': [moment().startOf('month'), moment().endOf('month')],
          'Минулий місяць': [
            moment().subtract(1, 'month').startOf('month'),
            moment().subtract(1, 'month').endOf('month')
          ]
        }
      },
    );
  });

  