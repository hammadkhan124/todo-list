//jshint esversion:6
const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://hk:12345@cluster0.5inuf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  { useUnifiedTopology: true }
);

const itemSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});
const item2 = new Item({
  name: "Hit + button to add new item.",
});

const item3 = new Item({
  name: "<-- to delete an item.",
});

const defaultitem = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, founditems) {
    if (founditems.length === 0) {
      Item.insertMany(defaultitem, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved default item in db");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { ListTitle: "Today", newListItems: founditems });
    }
  });
});
app.get("/:customlistname", function (req, res) {
  const customlistname = _.capitalize(req.params.customlistname);
  List.findOne({ name: customlistname }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        const list = new List({
          name: customlistname,
          items: defaultitem,
        });
        list.save();
        res.redirect("/" + customlistname);
      } else {
        res.render("list", {
          ListTitle: foundlist.name,
          newListItems: foundlist.items,
        });
      }
    }
  });
});
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.List;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundlist) {
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const chekeditemid = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(chekeditemid, function (err) {
      if (!err) {
        console.log("successfully delete item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: chekeditemid } } },
      function (err, foundlist) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("server is started at port 3000");
});
