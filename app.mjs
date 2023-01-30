import './db.mjs';
import express from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import connectEnsureLogin from 'connect-ensure-login';
import session from 'express-session';
import url from 'url';
import path from 'path';
import mongoose from 'mongoose';
import multer from 'multer';

const User = mongoose.model('User');
const Recipe = mongoose.model('Recipe');
const Comment = mongoose.model('Comment');

const upload = multer({dest: 'public/images/'});

const app = express();
app.set('view engine', 'hbs');
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const sessionOptions = { 
    secret: 'secret for signing session id', 
    saveUninitialized: false, 
    resave: false 
};
app.use(session(sessionOptions));

//////////////////
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
//////////////////

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.get('/', (req, res) => {
    if (req.user) {
      res.redirect('/browse');
    }
    else {
      res.render('index');
    }
});

app.get('/login', (req, res) => {
  if (req.user) {
    res.redirect('/browse');
  }
  else if (req.session.validpassword === false) {
    req.session.validpassword = null;
    res.render('login', {message: "Incorrect username or password"});
  }
  else {
      res.render('login'); 
  }
});

app.get('/register', (req, res) => {
  if (req.user) {
    res.redirect('/browse');
  }
  else if (req.session.validusername === false) {
      req.session.validusername = null;
      res.render('register', {message: "Username already in use"});
  }
  else {
    res.render('register');
  }
});

app.get('/browse', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  Recipe.find({}).sort('-createdAt').exec((err, recipes) => {
    res.render('browse', {recipes: recipes});
  });
});

app.get('/recipe-add', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.render('addRecipe');
});

app.post('/recipe-add', upload.single('image'), (req, res) => {
  const recipe = new Recipe({
    user: req.user.id,
    title: req.body.title,
    image: req.file.filename,
    estimatedTime: req.body.estimatedTime,
    numServings: req.body.numServings,
    estimatedCost: req.body.estimatedCost,
    difficultyLevel: req.body.difficultyLevel,
    cuisine: req.body.cuisine,
    description: req.body.description,
    ingredients: req.body.ingredients,
    instructions: req.body.instructions
  });

  recipe.save((err) => {
    if(err) {
      res.render('error', {message: 'error saving recipe: ' + err});
    }
    else {
      req.user.recipes.push(recipe);
      res.redirect('/browse');
    }
  });
});

app.get('/recipe/:slug', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  Recipe.findOne({slug: req.params.slug}).populate('user').exec(function (err, recipe) {
    if (err) {
      res.render('error', {message: 'error finding recipe: ' + err});
    }
    else {
      Comment.find({recipe: recipe.id}).populate('user').exec(function (err, comments) {
        if (err) {
          res.render('error', {message: 'error finding recipe: ' + err});
        }
        else {
          const path = "images/" + recipe.image;
          const slug = req.params.slug;
          let recipeSaved = false;
          const ids = req.user.saved.map(recipe => recipe._id.toString());
          if (ids.includes(recipe._id.toString())) {
            recipeSaved = true;
          }
          else {
            recipeSaved = false;
          }
          res.render('recipe-detail', {recipe, comments, path, recipeSaved: recipeSaved, slug});
        }
      });
    }
  });
});

app.post('/recipe/:slug', (req, res) => {
  const commentingUser = req.user;
  Recipe.findOne({slug: req.params.slug}).populate('user').exec(function (err, recipe) {
    if (err) {
      res.render('error', {message: 'error finding recipe: ' + err});
    }
    else {
      const comment = new Comment({
        user: commentingUser.id,
        recipe: recipe._id,
        description: req.body.description
      });

      comment.save((err) => {
        if(err) {
          res.render('error', {message: 'error saving article: ' + err});
        }
        else {
          recipe.comments.push(recipe);
          // res.redirect('/browse');
          res.redirect('/recipe/' + req.params.slug);
        }
      });
    }
  });
});

app.get('/recipe/:slug/edit', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  Recipe.findOne({slug: req.params.slug}).populate('user').exec(function (err, recipe) {
    if (err) {
      res.render('error', {message: 'error finding recipe: ' + err});
    }
    else if (!(req.user.id === recipe.user.id)) {
      res.render('error', {message: 'you do not have access to this page'});
    }
    else {
      res.render('editRecipe', {recipe});
    }
  });
});

app.get('/recipe/:slug/delete', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  Recipe.findOne({slug: req.params.slug}).populate('user').exec(function (err, recipe) {
    if (err) {
      res.render('error', {message: 'error finding recipe: ' + err});
    }
    else if (!(req.user.id === recipe.user.id)) {
      res.render('error', {message: 'you do not have access to this page'});
    }
    else {
      Recipe.deleteOne({slug: req.params.slug}, err => {
        if (err) {
          res.render('error', {message: 'error deleting recipe: ' + err});
        }
        else {
          res.redirect('/my-recipes');
        }
      });
    }
  });
});

app.get('/recipe/:slug/save', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  Recipe.findOne({slug: req.params.slug}).populate('user').exec(function (err, recipe) {
    if (err) {
      res.render('error', {message: 'error saving recipe: ' + err});
    }
    else {
      const ids = req.user.saved.map(recipe => recipe._id);
      let contains = false;
      for (const id of ids) {
        if (id.equals(recipe._id)) {
          contains = true;
          break;
        }
      }

      if (contains === true) {
        req.user.saved = req.user.saved.filter(function(ele) {
          return !ele._id.equals(recipe._id);
        });
      } else {
        req.user.saved.push(recipe);
      }

      req.user.save((err) => {
        if(err) {
          res.render('error', {message: 'error saving user ' + err});
        }
        else {
          res.redirect('/recipe/' + req.params.slug);
        }
      });
    }
  });
});

app.post('/recipe/:slug/edit', upload.single('image'), (req, res) => {
  const filter = {slug: req.params.slug};

  const update = {
    user: req.user.id,
    title: req.body.title,
    estimatedTime: req.body.estimatedTime,
    numServings: req.body.numServings,
    estimatedCost: req.body.estimatedCost,
    difficultyLevel: req.body.difficultyLevel,
    cuisine: req.body.cuisine,
    description: req.body.description,
    ingredients: req.body.ingredients,
    instructions: req.body.instructions
  };

  if (req.file !== undefined) {
    update.image = req.file.filename;
  }

  Recipe.findOneAndUpdate(filter, update, function(err) {
    if(err) {
      res.render('error', {message: 'error saving recipe: ' + err});
    }
    else {
      res.redirect('/my-recipes');
    }
  });
});

app.get('/my-recipes', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  Recipe.find({user: req.user.id}).sort('-createdAt').exec((err, recipes) => {
    res.render('myRecipes', {recipes: recipes});
  });
});

app.get('/saved-recipes', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  const recipes = req.user.saved;
  res.render('savedRecipes', {recipes: recipes});
});

app.post('/my-recipes', connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  if (req.body.delete === "Delete All My Recipes"){
    Recipe.deleteMany({user: req.user}, (err) => {
      if (err) {
        res.render('error', {message: 'error deleting recipe: ' + err});
      } 
      else {
        res.redirect('/browse');
      }
    });
  }
});

app.get('/logout', connectEnsureLogin.ensureLoggedIn(), function(req, res) {
  req.logout(function(err) {
    if (err) { 
      res.render('error', {message: 'error logging out: ' + err});
    }
    res.redirect('/');
  });
});

app.post("/login", (req, res, next) => {
  passport.authenticate('local', function(err,user) {
      if(user){
          req.logIn(user, () => res.redirect('/browse'));
      } else {
          req.session.validpassword = false;
          res.redirect("/login");
      }
  })(req, res, next);
});

app.post("/register", (req, res) => {
    const registeredUser = new User({
      username: req.body.username
    });

    User.register(registeredUser, req.body.password, function(err){
        if(err) {
            req.session.validusername = false;
            res.redirect("/register");
        } 
        else { 
            passport.authenticate("local")(req, res, function(){
            res.redirect("/login");
        });
      }
    });
});

app.listen(process.env.PORT || 3000);