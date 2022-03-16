/**
 * @jest-environment jsdom
 */

import { CartModel } from "./CartModel";


describe('CartModel Unit Test Suite', () => {
    const localStorageGetItemMock = jest.spyOn(Storage.prototype, 'getItem');
    const localStorageSetItemMock = jest.spyOn(Storage.prototype, 'setItem');
    let cartExample;

    const testCartModel = new CartModel();

    beforeEach(() => {
        localStorageGetItemMock.mockReset();
        localStorageSetItemMock.mockReset();
        cartExample = [
            {
                id: '1',
                color: 'blue',
                quantity: 3
            },
            {
                id: '2',
                color: 'pink',
                quantity: 6
            },
            {
                id: '3',
                color: 'red',
                quantity: 2
            }
        ];
    });


    describe('getCart() Method Test Suite', () => {
        it('should call the localStorage.getItem() method', () => {
            localStorageGetItemMock.mockReturnValue(JSON.stringify(cartExample));
            testCartModel.getCart();
            expect(localStorageGetItemMock).toHaveBeenCalled();
            expect(localStorageGetItemMock).toHaveBeenCalledWith(testCartModel.storageName);
        });

        it('should return the parsed cart object if there is a cart object in the localStorage', () => {
            localStorageGetItemMock.mockReturnValue(JSON.stringify(cartExample));
            const cartContent = testCartModel.getCart();
            expect(cartContent).toEqual(cartExample);
        });

        it('should return an empty array if there is no cart object in the localStorage', () => {
            localStorageGetItemMock.mockReturnValue(undefined);
            const cartContent = testCartModel.getCart();
            expect(cartContent).toEqual([]);
        });
    });


    describe('postCart() Method Test Suite', () => {
        it('should call the localStorage.setItem() method with the right key and the serialized cart object', () => {
            testCartModel.postCart(cartExample);
            expect(localStorageSetItemMock).toHaveBeenCalled();
            expect(localStorageSetItemMock).toHaveBeenCalledWith(testCartModel.storageName, JSON.stringify(cartExample));
        });
    });


    describe('addProduct() Method Test Suite', () => {
        const getCartMock = jest.spyOn(testCartModel, 'getCart');
        const postCartMock = jest.spyOn(testCartModel, 'postCart');

        beforeEach(() => {
            getCartMock.mockReset();
            postCartMock.mockReset();
            getCartMock.mockReturnValue(cartExample);
        });

        it('should call the getCart() method from the cart model', () => {
            testCartModel.addProduct({ id: 'test' });
            expect(getCartMock).toHaveBeenCalled();
        });

        it('should call the CartModel.postCart() method with the cart containing one more product', () => {
            const testProduct = {
                id: '4',
                color: 'green',
                quantity: 4
            };
            const newCart = cartExample.concat(testProduct);

            testCartModel.addProduct(testProduct);
            expect(postCartMock).toHaveBeenCalled();
            expect(postCartMock).toHaveBeenCalledWith(newCart);
        });

        it('should call the CartModel.postCart() method with the cart containing one more product if the new product has the same id but a different color than another product in the cart', () => {
            const testProduct = Object.assign({}, cartExample[0]);
            testProduct.color = 'indigo';
            testProduct.quantity = 2;
            const newCart = cartExample.concat(testProduct);

            testCartModel.addProduct(testProduct);
            expect(postCartMock).toHaveBeenCalled();
            expect(postCartMock).toHaveBeenCalledWith(newCart);
        });

        it('should call the CartModel.postCart() method with the cart having the updated quantity for the product that has been added and was already present', () => {
            const testProduct = Object.assign({}, cartExample[0]);
            testProduct.quantity = 2;
            const newCart = JSON.parse(JSON.stringify(cartExample));
            newCart[0].quantity += testProduct.quantity;

            testCartModel.addProduct(testProduct);
            expect(postCartMock).toHaveBeenCalled();
            expect(postCartMock).toHaveBeenCalledWith(newCart);
        });
    })
});