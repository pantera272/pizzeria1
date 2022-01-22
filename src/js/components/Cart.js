import {select, settings, classNames, templates } from '../settings.js';
import CardProduct from './CartProduct.js';
import utils from '../utils.js';
class Cart{
  constructor(element){
    const thisCart = this;

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initAction();
  }

  getElements(element){
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
  }

  initAction(){
    const thisCart = this;

    thisCart.dom.productList.addEventListener('update', function(){
      thisCart.update();
    });
    thisCart.dom.toggleTrigger.addEventListener('click', function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive); 
    });

    thisCart.dom.productList.addEventListener('remove', function(event){
      thisCart.remove(event.detail.cartProduct);
    });

    thisCart.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }

  add(menuProduct){
    const thisCart = this;
    const generatedHtml = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHtml);
      
    thisCart.dom.productList.appendChild(generatedDOM); 
      
    thisCart.products.push(new CardProduct(menuProduct, generatedDOM));

    thisCart.update();
  }

  update(){
    const thisCart = this;
    const deliveryFee = settings.cart.defaultDeliveryFee;

    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
      
      
    for(let product of thisCart.products)
    {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }
      
    if (thisCart.totalNumber != 0){
      thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
    } else {
      thisCart.totalPrice = 0;
    }
  }

  remove(cartProduct){
    const thisCart = this;

    thisCart.products.splice(thisCart.products.indexOf(cartProduct), 1);
    cartProduct.dom.wrapper.remove();
    thisCart.update();
      
  }

        
  sendOrder(){
    const thisCart = this;

    const url = settings.db.url + '/' + settings.db.orders;

    const payload = {};
    payload.address = thisCart.dom.address.value;
    payload.phone = thisCart.dom.phone.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    const deliveryFee = settings.cart.defaultDeliveryFee;
    payload.deliveryFee = deliveryFee;
    payload.products = [];

    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
      
    const options = {
      method: 'POST',
      headers: {
        'Content-type':'application/json',
      }, 
      body: JSON.stringify(payload),
    };

    fetch(url, options);
  }
}

export default Cart;