import {select, classNames, templates} from '../settings.js';
import { utils } from '../utils.js';

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
    //console.log('new Product:', thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;

    /* Generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);

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
    //console.log(thisProduct.amountWidgetElem);
  }

  initAccordion(){
    const thisProduct = this;

    /* find the clickable trigger (the element that should react to clicking) */
    //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

    //console.log(clickableTrigger);

    /* START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {

      /* prevent default action for event */
      event.preventDefault();

      /* find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);

      //console.log(activeProduct);

      /* if there is active product and it's not thisProduct.element, remove class active from it */
      if (activeProduct !== null && activeProduct !== thisProduct.element){
        activeProduct.classList.remove('active');
      }

      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle('active');

    });

  }

  initOrderForm(){
    const thisProduct = this;

    //console.log('initOrderForm');

    thisProduct.form.addEventListener('submit', function(event){
      console.log('submit');
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder() {
    const thisProduct = this;

    // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);

    // set price to default price
    let price = thisProduct.data.price;

    // for every category (param)...
    for(let paramId in thisProduct.data.params) {

      // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];
      //console.log(paramId, param);

      // for every option in this category
      for(let optionId in param.options) {

        //Find image in image wrapper
        const image = thisProduct.imageWrapper.querySelector('.'  + paramId + '-' + optionId);

        // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];
        //console.log(optionId, option);

        // check if formData contains optionId
        if(formData[paramId] && formData[paramId].includes(optionId)) {

          //If option is checked add active class for img
          if(image !== null) {
            //console.log(image.classList);
            image.classList.add(classNames.menuProduct.imageVisible);
          }

          //If option is not default and is checked add option price to price
          if(!option.default == true) {
            price = price + option.price;
          }

        } else{
        //If option is not checked remove active class from img
          if(image !== null) {
            image.classList.remove(classNames.menuProduct.imageVisible);
          }

          //If option is default and is unchecked decrease product price
          if(option.default == true) {
            price = price - option.price;
          }

        }

      }

    }

    //multiply price by amount
    price *= thisProduct.amountWidget.value;

    // update calculated price in the HTML
    thisProduct.priceMulti = price;
    thisProduct.priceElem.innerHTML = price;

  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;

    //app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });
    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.data.price,
      price: thisProduct.priceMulti,
      params: thisProduct.prepareCartProductParams(),
    };

    //console.log(productSummary);

    return productSummary;
  }

  prepareCartProductParams(){//obiekt z opcjami
    const thisProduct = this;
  
    const formData = utils.serializeFormToObject(thisProduct.form);
      
    const params ={};
      
    //for vry category (param)
    for(let paramId in thisProduct.data.params) {

      const param = thisProduct.data.params[paramId];
      //create category param in params const eg. params = {ingidients: {name: 'Ingridients', options: {}}}
      params[paramId] = {
        name: param.label,
        options:{}
      };
      // for every option in this category
        
      for(let optionId in param.options) {
          
        const option = param.options[optionId];
          
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if(optionSelected){

          params[paramId].options[optionId] = option.label; 
        }

      }

    }
          
    return params;          

  }     

}
export default Product;