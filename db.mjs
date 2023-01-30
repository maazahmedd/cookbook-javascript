import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import url from 'url';
import passportLocalMongoose from 'passport-local-mongoose';
import mongooseSlugPlugin from 'mongoose-slug-plugin';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// creating the user schema
const UserSchema = new mongoose.Schema({
    username: {type: String, required: true},
    recipes: [],
    saved: [],
    salt: String,
    hash: String
});

UserSchema.plugin(passportLocalMongoose);
mongoose.model('User', UserSchema)

// creating the recipe schema
const RecipeSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    title: String,
    image: String,
    // tags: ["tag1", "tag2"],
    estimatedTime: Number,
    numServings: Number,
    estimatedCost: Number,
    difficultyLevel: String,
    cuisine: String,
    description: String,
    ingredients: String,
    instructions: String,
    comments: []
})

RecipeSchema.plugin(mongooseSlugPlugin, {tmpl: '<%=title%>'});

mongoose.model('Recipe', RecipeSchema);

// creating the comments schema
const CommentSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    recipe: {type: mongoose.Schema.Types.ObjectId, ref: 'Recipe'},
    description: String,
})

mongoose.model('Comment', CommentSchema);

let dbconf;
if (process.env.NODE_ENV === 'PRODUCTION') {
 // if we're in PRODUCTION mode, then read the configration from a file
 // use blocking file io to do this...
 const fn = path.join(__dirname, 'config.json');
 const data = fs.readFileSync(fn);

 // our configuration file will be in json, so parse it and set the
 // conenction string appropriately!
 const conf = JSON.parse(data);
 dbconf = conf.dbconf;
} else {
 // if we're not in PRODUCTION mode, then use
 dbconf = 'mongodb://localhost/ma5938';
}

mongoose.connect(dbconf, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});