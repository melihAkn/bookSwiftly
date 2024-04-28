const { usersModel,userCartModel,userFavBooksModel,userBuyLaterModel,userWishListModel } = require('../model/users')
const { bookModel,bookCommentsModel } = require('../model/books')
const { hash,compare } = require('bcrypt')
const { userInfos , updateUserInfos, buyLaterBook, addWishList, addCommentToBooks } = require('../services/userService')
const userProfilePageRender = (req,res) => {
    res.render('./pages/userPages/userProfilePage',{layout : req.layout})
}
const getUserInfos = async (req,res) => {
    const getUserInfos = await userInfos({_id : req.userId.tokenIsValid})
    console.log(getUserInfos)
    res.status(200).send(getUserInfos[0])
}
const updateInfos = async (req,res) => {
    const update = await updateUserInfos({userId : req.userId.tokenIsValid , body : req.body})
    res.status(200).send(update)
}

const buyLaterThisBook = async (req,res) => {
    const buyLaterFunc = await buyLaterBook({id : req.userId.tokenIsValid , body : req.body})
    res.status(200).send(buyLaterFunc)
    
    
}

const addToWishList = async (req,res) => {

    console.log(req.body)
    const addWishListFunc = await addWishList({id : req.userId.tokenIsValid , body : req.body})
    res.status(200).send(addWishListFunc)

}

const addComment = async (req,res) => {
        // users cannot add comment more than 1 to books
        if(req.userId.ownerOfToken === "user"){
            const addCommentFunc = await addCommentToBooks({id : req.userId.tokenIsValid, body : req.body})
            res.status(200).send(addCommentFunc)
        }else{
            res.status(401).send({message : "only users can add comment books"})
        }
}

// I think this is not belong here so bookstores variables should be defined here
const {bookStoresModel,bookStoreOrdersModel,bookStoreCartModel, bookStoresBookModel} = require('../model/bookStores')
//code replication in here 
const userAndBookStoresAddToCart = async (req,res) => {
    console.log(req.body)
    let userShoppingCardJSON
    try {
        if(req.userId.ownerOfToken === "user"){
            const findThisBook = await userCartModel.findOne({userId : req.userId.tokenIsValid,bookId : req.body.bookId ,bookStoreId : req.body.sellerBookStoreInfos.bookStoreId})
            console.log(findThisBook)
            if(!findThisBook){
                 userShoppingCardJSON = {
                    userId : req.userId.tokenIsValid,
                    bookId : req.body.bookId,
                    bookStoreId : req.body.sellerBookStoreInfos.bookStoreId,
                    bookPrice : req.body.sellerBookStoreInfos.price,
                    quantity : req.body.quantity,
                    bookName : req.body.bookName
                }
                //save to userCart
                const userShoppingCard = new userCartModel(userShoppingCardJSON)
                await userShoppingCard.save()
            }else{
               findThisBook.quantity +=1
               await findThisBook.save()
            }
            res.status(200).send({message : "book successfully added to cart"})
    
        }else if(req.userId.ownerOfToken == "bookStore"){
            const findThisBook = await bookStoreCartModel.findOne({purchasingBookstoreID : req.userId.tokenIsValid,bookId : req.body.bookId})
            if(!findThisBook){
                const bookStoreShoppingCardJSON = {
                    purchasingBookstoreID : req.userId.tokenIsValid,
                    bookId : req.body.bookId,
                    sellerBookStoreId : req.body.sellerBookStoreInfos.bookStoreId,
                    bookPrice : req.body.sellerBookStoreInfos.price,
                    quantity : req.body.quantity,
                    bookName : req.body.bookName
                }
                //save to userCart
                const bookStoreShoppingCard = new bookStoreCartModel(bookStoreShoppingCardJSON)
                await bookStoreShoppingCard.save()
            }else{
               findThisBook.quantity +=1
               await findThisBook.save()
            }
            res.status(200).send({message : "book successfully added to cart"})
        }else{
            res.staus(401).send({message : "please login add to cart this book"})
        }
    } catch (error) {
        console.error(error)
        res.status(500).send({message : "Book couldn't be added to the cart",error})
    }
}

const userAndBookStoresAddToFavorite = async (req,res) => {
    try {
        const favoriteBook = {
            userId : req.userId.tokenIsValid,
            bookId : req.body.bookId
        }
        const addToFavorite = new userFavBooksModel(favoriteBook)
        await addToFavorite.save()
        res.status(200).send({message : "this book added to a favorite"})

    } catch (error) {
        console.error(error)
        res.status(500).send({message : "there was an error" , error})
    }
}
const userOrBookStoresGetCardDetails = async(req,res) => {
    try {
        if(req.userId.ownerOfToken === "user"){
            const shoppingListJSON = []
            const userShoppingList =  await userCartModel.find({userId : req.userId.tokenIsValid})
            const findUser = await usersModel.findById(req.userId.tokenIsValid)
            for(item in userShoppingList){
                const findBook = await bookModel.findById(userShoppingList[item].bookId)
                const findBookStore = await bookStoresModel.findById(userShoppingList[item].bookStoreId)
                shoppingListJSON.push(
                    {
                        bookId : findBook.id,
                        bookName : findBook.name,
                        bookStoreName : findBookStore.name,
                        bookStoreId : findBookStore.id,
                        quantity : userShoppingList[item].quantity,
                        bookImages : findBook.images,
                        bookPrice : userShoppingList[item].bookPrice,
                        otherBookStores : []
                    }
                )
                    const findOtherSellersOfThisBook = await bookStoresBookModel.find({bookId : findBook.id })
                    for(let index in findOtherSellersOfThisBook){
                        const findOtherBookStores = await bookStoresModel.findOne({_id : findOtherSellersOfThisBook[index].bookStoreId , city : findUser.city})
                        if(findOtherBookStores.id != findBookStore.id && !shoppingListJSON[item].otherBookStores.find(store => store.id === findOtherBookStores.id && store.id == findBookStore.id)) {
                            const findBookstoresBookPrice = await bookStoresBookModel.findOne({bookStoreId : findOtherBookStores.id , bookId : findBook.id})
                            const newStore = {
                                ...findOtherBookStores.toObject(),
                                price: findBookstoresBookPrice.price
                              }
                            shoppingListJSON[item].otherBookStores.push(newStore)
                        }
                    }
            }
            res.status(200).send(shoppingListJSON)
        }else if(req.userId.ownerOfToken == "bookStore"){
           console.log("qwda")
        }
    } catch (error) {
        console.error(error)
        res.status(500).send({message : "error retrieving your shopping card data",error})
    }
}
//bookstore update

const userOrBookStoresUpdateOrDeleteItem = async (req,res) => {
    console.log(req.body)
    try {
        for(let item in req.body){
            if(parseInt(req.body[item].quantity) == 0){
                await userCartModel.findOneAndDelete({bookName : req.body[item].bookName , bookStoreId : req.body[item].bookStoreId , bookPrice : req.body[item].bookPrice , userId : req.userId.tokenIsValid})
            }else{
                //if req.body book quantity is bigger than bookstores stock set the quantity bookstores book quantity
                await userCartModel.findOneAndUpdate({bookName : req.body[item].bookName , bookStoreId : req.body[item].bookStoreId , bookPrice : req.body[item].bookPrice , userId : req.userId.tokenIsValid} , {$set : {quantity : parseInt(req.body[item].quantity)}}, { new: true })
            }

        }
        res.status(200).send({message : "cart was updated successfully"})
    } catch (error) {
        res.status(500).send({error})
    }
   
}




const userAndBookStoresCopmleteOrder = async (req,res) => {
    let findUser
    try {
        if(req.userId.ownerOfToken === "user"){
            findUser = await usersModel.findById(req.userId.tokenIsValid)
            console.log(req.body)
            //get total Amount
            let totalAmount = 0
            for(const item in req.body){
                totalAmount += req.body[item].quantity
            }
            const customerOrder = {
                bookStoreId : req.body[0].bookStoreId,
                purchasingUserId : req.userId.tokenIsValid,
                customerInfos : {
                    name : findUser.nameAndSurname,
                    email : findUser.email,
                    phoneNumber : findUser.phoneNumber,
                    address : findUser.physcialAddress
                },
                items : [],
                totalAmount,
                paymentMethod : "cash on delivery",
            }
            for (const item in req.body){
                const findBook = await bookModel.findById(req.body[item].bookId)
                console.log(findBook)
                customerOrder.items.push({
                    bookName : req.body[item].bookName,
                    quantity : req.body[item].quantity,
                    price : req.body[item].bookPrice,
                    bookISBN : findBook.ISBN               
                })

            }
            console.log(customerOrder)
            const createOrder = new bookStoreOrdersModel(customerOrder)
            await createOrder.save()
            //console.log(createOrder)
            const deleteUserShoppingCard = await userCartModel.deleteMany({userId : req.userId.tokenIsValid})

            res.status(200).send({message : "order created successfully you can show order infos profile page"})
    
        }else if(req.userId.ownerOfToken === "bookStore"){
            findUser = await bookStoresModel.findById(req.userId.tokenIsValid)
    
    
    
    
    
        }
    } catch (error) {
        console.error(error)
        res.status(500).send(error)
    }
   
}




const getUserOrders = async (req,res) => {

    try {
        let orders =[]
        const findUserOrders = await bookStoreOrdersModel.find({purchasingUserId : req.userId.tokenIsValid}) 
        for(const item in findUserOrders){
            const findBookStores = await bookStoresModel.findById(findUserOrders[item].bookStoreId)
            orders.push({
                items : findUserOrders[item].items,
                orderStatus : findUserOrders[item].orderStatus,
                orderDate : findUserOrders[item].orderDate,
                paymentMethod : findUserOrders[item].paymentMethod,
                bookstoreName : findBookStores.name,
                bookstorePhyscialAddress : findBookStores.physcialAddress
            })
      }
      res.status(200).send(orders)
    } catch (error) {
        res.status(500).send(error)
    }

}

module.exports = {
    userProfilePageRender,
    getUserInfos,
    updateInfos,
    addToWishList,
    addComment,
    //bookstores and user routes maybe not belong here I dont know
    userAndBookStoresAddToCart,
    userAndBookStoresAddToFavorite,
    userOrBookStoresGetCardDetails,
    userAndBookStoresCopmleteOrder,
    userOrBookStoresUpdateOrDeleteItem,
    getUserOrders,
    buyLaterThisBook
    
}
