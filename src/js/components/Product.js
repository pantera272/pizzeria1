import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
     
    //console.log('new products:', thisProduct);
  }
    
  renderInMenu(){
    const thisProduct = this;
    const generatedHtml = templates.menuProduct(thisProduct.data);
      
    thisProduct.element = utils.createDOMFromHTML(generatedHtml);
    const menuConteiner = document.querySelector(select.containerOf.menu);
    menuConteiner.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion(){
    const thisProduct = this;
     
    thisProduct.accordionTrigger.addEventListener('click', function(event){
      event.preventDefault();
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      if (activeProduct != null && activeProduct != thisProduct.element){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm(){
    const thisProduct = this;
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);

    let price = thisProduct.data.price;

    for(let paramId in thisProduct.data.params) {

      const param = thisProduct.data.params[paramId];    
        
      for(let optionId in param.options) {
          
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        const optionImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);
          
        if(optionSelected) {
          // check if the option is not default
          if(!option.default == true) {
            price += option.price; 
          }
        } else {
          // check if the option is default
          if(option.default == true) {
            price -= option.price;
          }
        }

        if (optionImage){
          if (optionSelected){
            optionImage.classList.add(classNames.menuProduct.imageVisible); 
          }
          else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible); 
          }
        }
      }    
    }

    // update calculated price in the HTML
    thisProduct.priceSingle = price;
    price *= thisProduct.amountWidget.value;
    thisProduct.priceElem.innerHTML = price;

  }

  initAmountWidget(){
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('update', function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;

    //app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles:true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      }
    });

    thisProduct.element.dispatchEvent(event);
  }

    
  prepareCartProduct(){
    const thisProduct = this;
    
    const productSummary = {};

    productSummary.id = thisProduct.id; 
    productSummary.name = thisProduct.data.name;
    productSummary.amount = thisProduct.amountWidget.value;
    productSummary.priceSingle = thisProduct.priceSingle;
    productSummary.price = thisProduct.data.price * productSummary.amount;
    productSummary.params = thisProduct.prepareCartProductParams();

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};

    for(let paramId in thisProduct.data.params) {

      const param = thisProduct.data.params[paramId];
      params[paramId] = {
        label: param.label,
        options: {}
      };    
        
      for(let optionId in param.options) {
          
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
             
        if(optionSelected) {
          params[paramId].options[optionId] = option.label; 
        }
      }    
    }
      
    return params;
  }    
}

export default Product;