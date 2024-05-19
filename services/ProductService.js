const { searchBookByFieldName , getCommentsByFieldName , countBooks, booksSellInfos } = require('../repositories/booksRepository')
const { getBookStoresByField, getBookStoresBookByField, addBookStoreRatings , findBookStoreRating, findMonthOfBookstores } = require('../repositories/bookStoreRepository')
// bookstore infos
async function searchedBookInfos(bookData,limitData) {
    let books = []
    //const findAllBooks = await bookModel.find({ name : bookData.name })
    const findAllBooksByName = await searchBookByFieldName(bookData,{start : limitData.skip , limit : limitData.limit})
    const findBookStoresInSearchedCity = await getBookStoresByField({ city : limitData.city })

    for (const bookStore of findBookStoresInSearchedCity) {
        //
        const bookStoresBooks = await getBookStoresBookByField({ bookStoreId : bookStore._id})
        for (const bookStoresBook of bookStoresBooks) {
            const foundBook = findAllBooksByName.find(book => book._id.toString() === bookStoresBook.bookId.toString())
    
            if (foundBook) {
                const existingBookIndex = books.findIndex(book => book._id.toString() === foundBook._id.toString())
                // -1 mean book cannot be found
                if (existingBookIndex !== -1) {
                    books[existingBookIndex].bookStoreInfos.push({
                        bookStoreId: bookStore._id,
                        bookStoreName : bookStore.name,
                        stockInfo: bookStoresBook.stockInfo,
                        price: bookStoresBook.price
                    })
                } else {
                    books.push({
                        _id: foundBook._id,
                        name: foundBook.name,
                        description: foundBook.description,
                        pageCount: foundBook.pageCount,
                        category: foundBook.category,
                        averageRating: foundBook.averageRating,
                        publicationDate: foundBook.publicationDate,
                        author: foundBook.author,
                        ISBN: foundBook.ISBN,
                        images: foundBook.images,
                        isValidBook: foundBook.isValidBook,
                        bookStoreInfos: [{
                            bookStoreId: bookStore._id,
                            bookStoreName : bookStore.name,
                            stockInfo: bookStoresBook.stockInfo,
                            price: bookStoresBook.price
                        }]
                    })
                }
            }

        }
        for(index in books){
            books[index].bookStoreInfos.sort((a,b) => a.price - b.price)
        }
    }
    if(books.length == 0){
        books = findAllBooksByName
        return { message : "There are no bookstores selling the searched book or books in the city. you can add to wishlist searched books ",bookFound : false ,books}
    }else{
        
        return {books , bookFound : true}
    }
    


}
async function getCountBooks(_) {
    const bookC = await countBooks()
    return bookC

}
async function getBookComments(bookData) {
    const getComments = await getCommentsByFieldName(bookData)
    return getComments
} 

async function mostSelledBooksByCity(bookData) {
    const getBooksSellInfos = await booksSellInfos({bookCity : bookData.city},25)
    return getBooksSellInfos


}




async function mostPopularCategorys(bookData) {
    // getting most popular category from books sell infos table 
    // and fill an array return the categorys
    const categorys = require('../public/frontendStuff/bookCategories.json')
    const getBooksSellInfos = await booksSellInfos({bookCity :bookData.city},25)
    let mostPopularCategory = []
    for(let i = 0; i < categorys.length; i++){
        mostPopularCategory.push({bookCategory : categorys[i],count : 0})
    }
    for(const item of getBooksSellInfos){
        for(let k = 0; k < mostPopularCategory.length; k++){
            if(item.bookCategory == mostPopularCategory[k].bookCategory){
                mostPopularCategory[k].count +=1
            }
        }
    }
    mostPopularCategory.sort((a,b) => b.count - a.count)
    const firstFivePopularCategories = mostPopularCategory.slice(0,5) 
    return firstFivePopularCategories
}






async function aiSuggestedThisBooks(bookData) {
}




async function mostReliableBookstores(bookStoreData,limitData) {
    const getBookstoreRatings = await findBookStoreRating(bookStoreData,limitData)
    return getBookstoreRatings


}
async function monthOfBookstores(bookStoreData) {
    const getMonthOfBookStores = await findMonthOfBookstores(bookStoreData,{limit : 10})
    return getMonthOfBookStores


}

async function popularAndRisingBookstores(bookStoreData) {
    let popularAndRisingBs = []
    const getMonthOfBookStores = await findMonthOfBookstores(bookStoreData,{limit : 10})
    for (const item of getMonthOfBookStores) {
        const findBookStore = await getBookStoresByField({ _id: item.bookStoreId, city: item.bookStoreCity })

        if (findBookStore.length > 0 && findBookStore[0].createdAt) {
            const createdAtDate = new Date(findBookStore[0].createdAt)
            const currentDate = new Date()
            //convert miliseconds to day
            const differenceInDays = (currentDate - createdAtDate) / (1000 * 60 * 60 * 24)

            if (differenceInDays <= 30) {
                popularAndRisingBs.push(item)
            }
        }
    }
    return popularAndRisingBs
}



module.exports = {
    searchedBookInfos,
    getBookComments,
    getCountBooks,
    mostSelledBooksByCity,
    mostPopularCategorys,
    mostReliableBookstores,
    monthOfBookstores,
    popularAndRisingBookstores,
    aiSuggestedThisBooks,
    searchedBookInfos
    
    }
