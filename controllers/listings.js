const express = require('express');
const router = express.Router();

const Listing = require('../models/listing');
const { route } = require('./auth');
const { populate } = require('../models/user');
const formatterCurrency = require('../utilities/formatCurrency');



// Index  	GET	/listings
router.get('/', async (req, res)=>{

  try {
    const populatedListings = await Listing.find({}).populate('owner'); // Fetch all listings
    // populate() will tell mongoose to auto fetch and replace ObjectId reference with the actual complete document from other collections
    res.render('listings/index.ejs', { listings: populatedListings });
  } catch {
    console.error(error);
    res.render('listings/index.ejs');
  }
  
})

// New GET listings/new
router.get('/new',(req,res)=>{
  res.render('listings/new.ejs')
})

// Create POST /listings
router.post('/', async(req, res)=>{
  try {
    const { city, streetAddress, price, size } = req.body
    if(!city.trim()) throw new Error('City requires a proper City');
    if(!streetAddress.trim()) throw new Error('Please provide a proper Address');
    if(size < 0 || size === '') throw new Error('Invalid size, please provide a size greater than 0')
    if(price < 0 || price === '') throw new Error('Invalid price, please provide a price greater than $0')
    
    req.body.owner = req.session.user._id; // pass id to owner
    await Listing.create(req.body);
    res.redirect('/listings');
  } catch (error) {
    console.log('Create error:', error);
    req.session.message = error.message;
    req.session.save(()=>{
    res.redirect('/listings/new')
    }) // save to database
  }
  
})

// Show GET /listings/:listingId
router.get("/:listingId", async (req, res) => {
  try {
    const foundListing = await Listing.findById(req.params.listingId).populate(
      "owner"
    );

    const userHasFavorited = foundListing.favoritedByUsers.some(user => {
      return user.equals(req.session.user._id)
    })

    const currency = formatterCurrency(foundListing.price)

    foundListing.price = currency

    if (!foundListing)
      throw new Error(
        `Failed to find a property with id ${req.params.listingId}`
      );
    res.render("listings/show.ejs", { listing: {
      price: currency,
      _id: foundListing._id,
      size: foundListing.size,
      streetAddress: foundListing.streetAddress,
      city: foundListing.city,
      owner: foundListing.owner,
      favoritedByUsers: foundListing.favoritedByUsers
    }, userHasFavorited});
  } catch (error) {
    console.log(error);
    req.session.message = error.message;
    req.session.save(() => {
      res.redirect("/listings");
    });
  }
});

// Edit /listings/:listingId/edit
router.get('/:listingId/edit', async(req, res)=>{
  try {
    const currentListing = await Listing.findById(req.params.listingId);
    
    res.render('listings/edit.ejs', { listing: currentListing });
  } catch (error) {
    console.log(error);
    res.redirect('Edit error:', '/listings');
  }
})

// Update POST users/:userId/listings/:listingId/
router.put("/:listingId", async (req, res) => {
  try {
    const foundListing = await Listing.findById(req.params.listingId);
    if (!foundListing.owner._id.equals(req.session.user._id)) {
      throw new Error("You must own this property to update it");
    }

    await foundListing.updateOne(req.body);

    res.redirect(`/listings/${req.params.listingId}`);
  } catch (error) {
    console.log(error);
    req.session.message = error.message;
    req.session.save(() => {
      res.redirect('Post error:', "/listings");
    });
  }
});


// Delete DELETE /listings/delete
router.delete('/:listingId', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId);
    
    if (!listing) {
      req.session.message = 'Listing not found';
      return req.session.save(() => res.redirect('/listings'));
    }
    
    if (!listing.owner.equals(req.session.user._id)) {
      req.session.message = "You don't have permission to delete this listing";
      return req.session.save(() => res.redirect(`/listings/${req.params.listingId}`));
    }
    
    await listing.deleteOne();
    req.session.message = 'Listing deleted successfully';
    return req.session.save(() => res.redirect('/listings'));
    
  } catch (error) {
    console.error('Delete error:', error);
    req.session.message = error.message;
    return req.session.save(() => res.redirect('/listings'));
  }
});

// Favorite Button
router.post('/:listingId/favorited-by/:userId', async(req, res)=>{
  try {
    const listing = await Listing.findById(req.params.listingId);
    if (!listing) throw new Error('Listing not found');

    await Listing.findByIdAndUpdate(req.params.listingId, {
      $push: { favoritedByUsers: req.params.userId }  // ← Only adds if NOT present
    });

    req.session.message = '❤️ Added to favorites!';
    return req.session.save(() => res.redirect(`/listings/${req.params.listingId}`));
    
  } catch (error) {  
    console.error('Favorite error:', error);
    req.session.message = error.message;
    return req.session.save(() => res.redirect(`/listings/${req.params.listingId}`));
  }
});

// Unfavorite Button
router.delete('/:listingId/favorited-by/:userId', async (req, res) => {
  try {
    await Listing.findByIdAndUpdate(req.params.listingId, {
      $pull: { favoritedByUsers: req.params.userId },
    });
    res.redirect(`/listings/${req.params.listingId}`);
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});


// Seed
router.get("/seed", async (req, res) => {
  // await Listing.deleteMany({})
//   await Listing.create([
// {
//   streetAddress: "1234 Sunset Blvd., Los Angeles, CA 90069",
//   price: 1250000,
//   size: 1850,
//   city: "Los Angeles",
// },
// {
//   streetAddress: "456 Ocean Ave., Santa Monica, CA 90401", 
//   price: 895000,
//   size: 1420,
//   city: "Santa Monica",
// },
// {
//   streetAddress: "789 Hollywood Hills Dr., Los Angeles, CA 90046",
//   price: 2350000,
//   size: 3200,
//   city: "Los Angeles",
// },
// {
//   streetAddress: "1011 Venice Blvd., Venice, CA 90291",
//   price: 1475000,
//   size: 2100,
//   city: "Venice",
// },
// {
//   streetAddress: "222 Beverly Dr., Beverly Hills, CA 90210",
//   price: 4500000,
//   size: 5200,
//   city: "Beverly Hills",
// },
// {
//   streetAddress: "333 Market St., San Francisco, CA 94105",
//   price: 1675000,
//   size: 1980,
//   city: "San Francisco",
// },
// {
//   streetAddress: "555 Main St., San Diego, CA 92101",
//   price: 875000,
//   size: 1650,
//   city: "San Diego",
// }

//   ]);

  res.redirect('/listings')
});


module.exports = router;
