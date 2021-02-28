/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
    },
    containerOf: {
      menu: '#product-list',//kontener produktow
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',//naglowek produktu
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {//dostep do selektorow ze zmiana ilosci produktow
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',//aktywny produkt z klasa active
      imageVisible: 'active',//pokazanie obrazka
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {//obiekt
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),//metoda menuProduct tworzona za pomoca Handlebars
  };

  class Product{
    constructor(id, data){//informacja o nazwie i strukturze produktu
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();//jesli chcemy zeby jakas metoda uruchamiala sie przy stworzeniu instancji to doadalemy ja w konstruktorze!
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget('updated',function(){
        thisProduct.amountWidgetElem();
      });
      thisProduct.processOrder();
      //console.log('new Product:', thisProduct);
    }

    renderInMenu(){
      const thisProduct = this;
      /*generate HTML based on template wygeneruj kod html pojedynczego produktu na bazie tempaltes Handlebars*/
      const generatedHTML = templates.menuProduct(thisProduct.data);//wywolujemy metode templates.menuProduct i przekazujemy jej dane do produktu
      /*create element usin utils.createElementFromHTML storz element DOM na podstawie kodu html tego produktu*/
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      /*find menu container znajdz na stronie kontener menu*/
      const menuContainer = document.querySelector(select.containerOf.menu);
      /*add element to menu wstaw stworzony element DOM do znalezionego kontenera menu*/
      menuContainer.appendChild(thisProduct.element);//metoda appenChild dodaje element do menu
    }

    getElements(){//do odnalezienia elementow w kontenerze produktu
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);//dostep do div w ktorym sa obrazki
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);//dostep do diva z imputem i buttonami +/-
    }

    initAccordion(){
      const thisProduct = this;

      /* find the clickable trigger (the element that should react to clicking) */
      const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

      /*START: add event listener to clickable trigger on event click*/
      clickableTrigger.addEventListener('click', function(event){
        /*prevent default action for event*/
        event.preventDefault();
        /*find active product (product that has active class)*/
        const activeProduct = document.querySelector('.product.active');
        
        /*if there is active product and it's not thisProduct.element, remove class active from it*/
        if(activeProduct !== null && activeProduct !== thisProduct.element) {activeProduct.classList.remove('active');}
        /*toggle active class on thisProduct.element*/
        thisProduct.element.classList.toggle('active');
      });
    }
    
    
    initOrderForm(){//metoda odpowiedzialna za dodanie listenerow eventow do formularza, jego kontrolek, guzika 
      const thisProduct = this;
      //console.log('initOrderForm');

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }
      thisProduct.cartButton.addEventListener('click', function(event) {
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    initAmountWidget(){//utworzenie nowej instancji klasy AmountWidget i zapisywanie jej we wlasciwosci produktu
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    }
    
    processOrder(){//metoda obliczajaca cene produktu
      const thisProduct = this;
      
      //convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);//odczytujemy ktore opcje formularza zostaly wybrane(zaznaczone)
      //console.log('formData', formData);
      //set price to default price - zmienna, ktora bedzie trzymac nasza cene, standardowo przyjmuje domyslna cene produktu
      let price = thisProduct.data.price;

      //for every category (param)...ta petla przejdzie po wszysttkich kategoriach
      for(let paramId in thisProduct.data.params){

        //determine param value, e.g. paramId = 'toppings', param = {label: 'Toppings', type: 'checkboxes'...} ta pętla zwróci tylko nazwę wlasciwosci
        const param =thisProduct.data.params[paramId];
        

        //for every option in this category ta petla przejdzie po wszystkich opcjach danej kategorii
        for(let optionId in param.options){
          //determine option value, e.g. optionId = 'olives', option = {label: 'Olives', price: 2, default: true}

          const option = param.options[optionId];
          
          const selector = '.' + paramId + '-' + optionId;//obrazek odpowiadajacy konkretnej parze kategoria-opcja; bo tego typu klasy maja wszystkie obrazki odpowiadajace opcjom

          const optionImage = thisProduct.imageWrapper.querySelector(selector);//znalezienie obrazka w divie z obrazkami
          
          if(formData[paramId] && formData[paramId].includes(optionId)) {
            if(optionImage !== null) {
              optionImage.classList.add(classNames.menuProduct.imageVisible);//pokazanie obrazka
            }
          } else {
            //If option is not checked remove active class from img
            if(optionImage !== null) {
              optionImage.classList.remove(classNames.menuProduct.imageVisible);
            }
          }
          
          //check if there is param with a name of paramId in formData and if it includes optionId
          if(formData[paramId] && formData[paramId].includes(optionId)){
            //check if the option is not default
            if(!option.default){
              //add option price to price variable
              price = price + option.price;
              
            }
            
          } else {
            //check if the option is default
            if(option.default){
              //reduce price variable
              price = price - option.price;
            }
          }

        }
      }
      //multiply price by amount wyswietlimy ilosc sztuk pomnozona przez cene
      price *= thisProduct.amountWidget.value;
      //update calculated price in the HTML czyli wpisujemy przeliczona cene do elementu w html; zmienna price zostaje przeliczona i uaktulaniona
      thisProduct.priceElem.innerHTML = price;
    }  
  }

  class AmountWidget{// + lub - mozemy wiekszac lub zmniejszac warosc pola i informuje produkty o zmianie ich wartosci; wlacza sie processOrder
    constructor(element){//klasa korzysta z inputu i buttonow
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.setValue();
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;
      thisWidget.element = element;

      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){//funkcja uruchamia sie w momencie zmiany wartosci w polu i kontroluje czy to co jest wpisane moze pozostac
      const thisWidget = this;
      const newValue = parseInt(value);//przekonwertowanie na liczbę

      /*TODO: Add validation*/
      if(thisWidget.value !== newValue && !isNaN(newValue) && thisWidget.value >= settings.amountWidget.defaultMin && thisWidget.value <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;        
      }

      announce(){//klasa odpowiedzialna za stworzenie obiektu "eventu"
        const thisWidget = this;

        const event = new Event('updated');
        thisWidget.element.dispatchEvent(event);//metoda dispatchEvent emituje event na kliknietym obiekcie
      }

      thisWidget.value = newValue;//zapisuje w thisWidget.value wartosc przekazanego argumentu po przekonwertowaniu na liczbe
      thisWidget.input.value = thisWidget.value;//aktualizacja wartosci inputu
      thisWidget.setValue(thisWidget.input.value);//czy ten kod ma tu byc?

      
    }
    //console.log('AmountWidget:', thisWidget);
    //console.log('constructor arguments:', element);
    
    initActions(){
      const thisWidget = this;

      thisWidget.input('change', function(){
        setValue(value);
      });
      thisWidget.linkDecrease('click', function(){
        event.preventDefault();
        setValue(thisWidget.value) - 1;
      });
      thisWidget.linkIncrease('click', function(){
        event.preventDefault();
        setValue(thisWidget.value) + 1;
      });
    }
    
  }

  const app = {
    initMenu: function() {
      const thisApp = this;
      //console.log('thisApp.data:', thisApp.data);
      for(let productData in thisApp.data.products){
        new Product(productData, thisApp.data.products[productData]);//dzieki[]dostaniemy sie do wartosci w obiektach a nie tylko ich nazw
      }
    },    
    initData: function(){//celem tej metody jest przygotowanie dostepu do danych w dataSource
      const thisApp = this;
      thisApp.data = dataSource;//referencja data kieruje do danych w dataSource
    },
    init: function(){
      const thisApp = this;
      //console.log('*** App starting ***');
      //console.log('thisApp:', thisApp);
      //console.log('classNames:', classNames);
      //console.log('settings:', settings);
      //console.log('templates:', templates);
    
      thisApp.initData();
      thisApp.initMenu();
    },    
  }; 
  
  app.init(); 
}