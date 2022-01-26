import {templates, select, settings,classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import HourPicker from './HourPicker.js';
import DatePicker from './DatePicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getDate();
  }

  getDate(){
    const thisBooking = this;

    const startDateParam =  settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    
    const params = {
      booking:[
        startDateParam,
        endDateParam,      
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,       
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,       
      ],      
    }; 

    //console.log('params: ',params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event   + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event   + '?' + params.eventsRepeat.join('&'),
    };
    //console.log('url: ',urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventRepeatResponse = allResponses[2];

        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseDate(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseDate(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    
    thisBooking.booked = {};
    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }  
      }  
    }

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.selectedTable = null;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvalible = false;
    
    if(typeof thisBooking.booked[thisBooking.date] == 'undefined' || typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'){
      allAvalible = true;
    }

    for(let table of thisBooking.dom.tables){
      table.classList.remove(classNames.booking.tableSelected);
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(!allAvalible && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }
     
  render(element){
    const thisBooking = this;

    const generatedHtml = templates.bookingWidget();
    
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHtml;

    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);

    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = thisBooking.dom.wrapper.querySelector(select.booking.floorPlan);

    thisBooking.dom.sendButton = thisBooking.dom.wrapper.querySelector(select.booking.sendBooking);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starter);
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);

    // eslint-disable-next-line no-unused-vars
    thisBooking.dom.peopleAmount.addEventListener('click', function(event){
      console.log('click people');
    });
    // eslint-disable-next-line no-unused-vars
    thisBooking.dom.hoursAmount.addEventListener('click', function(event){
      console.log('click hours');
    });

    thisBooking.dom.wrapper.addEventListener('update', function(){
      thisBooking.updateDOM();
      thisBooking.removeSelectedTable();
      thisBooking.selectedTable = null;
    });

    thisBooking.dom.floorPlan.addEventListener('click', function(event){
      thisBooking.selectTable(event.target);
    });

    thisBooking.dom.sendButton.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });

  }

  selectTable(tableId){
    const thisBooking = this;

    const isTable = tableId.classList.contains(classNames.booking.table);
    const offTable = tableId.classList.contains(classNames.booking.tableBooked);
    const selectedTable = tableId.classList.contains(classNames.booking.select);

    if(isTable && !offTable){
      if(!selectedTable){
        thisBooking.selectedTable = tableId.getAttribute(settings.booking.tableIdAttribute);
        thisBooking.removeSelectedTable();
        tableId.classList.add(classNames.booking.select);
      }else{
        thisBooking.selectedTable = null;
        thisBooking.removeSelectedTable();
      }      
    }
  }

  removeSelectedTable(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){
      table.classList.remove(classNames.booking.select);
    }  
  }

  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const booking = {};
    let starters = [];

    for(let starter of thisBooking.dom.starters){
      const starterEnable = starter.checked;
      if(starterEnable){
        starters.push(starter.value);
      }   
    }  

    booking.date = thisBooking.datePicker.value;
    booking.hour = thisBooking.hourPicker.value;
    booking.table = parseInt(thisBooking.selectedTable);
    booking.duration = thisBooking.hoursAmount.value;
    booking.ppl = thisBooking.peopleAmount.value;
    booking.starters = starters;
    booking.phone = thisBooking.dom.phone.value;
    booking.address = thisBooking.dom.address.value;
    console.log('send', booking);

    const options = {
      method: 'POST',
      headers: {
        'Content-type':'application/json',
      }, 
      body: JSON.stringify(booking),
    };

    fetch(url, options)
      .then(thisBooking.makeBooked(booking.date, booking.hour, booking.duration, booking.table));
  }
}

export default Booking;