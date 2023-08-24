//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connecting to database
mongoose.connect("mongodb://localhost:27017/todolistDB");

//defineing schema
const itemSchema = {
  name: String,
};

//creating model
const Item = mongoose.model("item", itemSchema);

// documenting data
const item1 = new Item({
  name: "Well come to To-Do list!!",
});

const item2 = new Item({
  name: "Press + button to add new item",
});

const item3 = new Item({
  name: "<-- hit this to delete the item",
});

//putting default item into array
const defaultItem = [item1, item2, item3];

// new schema for dynamic routing
const listSchema = {
  name : String,
  item: [itemSchema]
};

// creating model
const List = mongoose.model("list", listSchema); 

//reading data from databases
app.get("/", function (req, res) {
  Item.find()
    .then(function (data) {
      if (data.length === 0) {

        // instering default item into database
        Item.insertMany(defaultItem)
          .then(function () {
            console.log("[+]added default item.");
          })
          .catch(function (err){
            console.log(err);
          });
        res.redirect("/");

      } else {
        res.render("list", { listTitle: "Today", newListItems: data });
      }
    })

    .catch(function (err) {
      console.log(err);
    });
});

// adding new item in list
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    
      item.save()
      .then(function(){
        console.log("[+]added new item.");
      });
      res.redirect("/");   

  }else{
    List.findOne({name: listName})
    .then(function(foundList){
      foundList.item.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
    .catch(function(err){
      console.log(err);

    });
  }
});

//deleting the item
app.post("/delete",function(req,res){
  const checkedItemId= req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findOneAndRemove({_id:checkedItemId})
    .then(function(){
      console.log("[-]deleted item");
      res.redirect("/");
    })
    .catch(function(err){
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({name: listName},{ $pull: {item:{_id: checkedItemId}}})
    .then(function(){
      res.redirect("/" + listName);
    })
  }


});

// creating dynamic route
app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName);

  // checking same name
  List.findOne({ name : customListName})
  .then(function(foundList){
    if(!foundList){
      // create new list
      
      // creating document
      const list = new List({
        name : customListName,
        item : defaultItem 
      });
      // saving into database
      list.save();

      // redirecting
      res.redirect("/" + customListName);

    }else{
      // render existing list
      res.render("list",{listTitle: foundList.name, newListItems: foundList.item});
    }
  })
  .catch(function(err){
    console.log(err);
  });
});



app.get("/about", function (req, res) {
  res.render("about");
});


// localhost 
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
