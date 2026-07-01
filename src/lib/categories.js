export const GROCERY_CATEGORIES = [
  {
    key: 'meat', label: 'Meat & Poultry', icon: '🥩', color: '#b8291a',
    keywords: ['beef','steak','ground beef','pork','sausage','bacon','ham','chicken','turkey','lamb','veal','brisket','ribs','chop','loin','roast','ham hock','salt pork','chorizo','pepperoni','prosciutto','pancetta','duck','venison','bison','meatball','hot dog','bratwurst','kielbasa']
  },
  {
    key: 'seafood', label: 'Seafood', icon: '🐟', color: '#2d6b8a',
    keywords: ['fish','salmon','tuna','shrimp','crab','lobster','scallop','clam','oyster','mussel','cod','tilapia','halibut','catfish','trout','anchovy','sardine','squid','octopus','crawfish','crayfish','sea bass','mahi','snapper','grouper']
  },
  {
    key: 'produce', label: 'Fresh Produce', icon: '🥬', color: '#3a7d44',
    keywords: ['onion','garlic','tomato','pepper','bell pepper','jalapeño','carrot','celery','potato','sweet potato','yam','lettuce','spinach','kale','cabbage','broccoli','cauliflower','zucchini','squash','eggplant','cucumber','avocado','mango','peach','apple','lemon','lime','orange','berry','strawberry','blueberry','raspberry','banana','grape','pear','plum','cherry','melon','watermelon','cantaloupe','pineapple','coconut','fig','date','raisin','cranberry','corn','green bean','pea','asparagus','artichoke','beet','turnip','leek','scallion','green onion','shallot','ginger','mushroom','cilantro','parsley','basil','mint','thyme','rosemary','sage','dill','chive','bay leaf','lemongrass']
  },
  {
    key: 'dairy', label: 'Dairy & Eggs', icon: '🧈', color: '#c8962a',
    keywords: ['milk','butter','cream','heavy cream','sour cream','cream cheese','cheese','parmesan','cheddar','mozzarella','ricotta','gouda','brie','feta','cottage cheese','yogurt','egg','eggs','buttermilk','half and half','whipped cream','ghee','evaporated milk','condensed milk','powdered milk','mascarpone']
  },
  {
    key: 'bakery', label: 'Bread & Bakery', icon: '🍞', color: '#9e6b2a',
    keywords: ['bread','sourdough','baguette','roll','bun','tortilla','pita','naan','bagel','english muffin','croissant','biscuit','cracker','breadcrumb','panko','cornbread','flatbread']
  },
  {
    key: 'dry_goods', label: 'Dry Goods & Pantry', icon: '🌾', color: '#5a7a3a',
    keywords: ['flour','sugar','brown sugar','powdered sugar','cornstarch','cornmeal','oat','oatmeal','rice','pasta','noodle','spaghetti','penne','macaroni','quinoa','lentil','bean','pinto bean','black bean','chickpea','kidney bean','dried','couscous','barley','baking powder','baking soda','yeast','cocoa','chocolate chip','gelatin','tapioca','arrowroot','cereal','granola','popcorn']
  },
  {
    key: 'canned', label: 'Canned & Jarred', icon: '🫙', color: '#6b4a2a',
    keywords: ['canned','tomato sauce','tomato paste','diced tomato','crushed tomato','tomato puree','broth','stock','chicken broth','beef broth','vegetable broth','coconut milk','evaporated','condensed','soup','olives','pickle','capers','artichoke heart','sun-dried tomato','roasted pepper','salsa','pesto','tapenade','jam','jelly','preserves','honey','maple syrup','molasses','corn syrup','apple sauce','pumpkin puree','chipotle']
  },
  {
    key: 'spices', label: 'Spices & Seasonings', icon: '🌶️', color: '#8b2a00',
    keywords: ['salt','pepper','black pepper','white pepper','cayenne','paprika','smoked paprika','cumin','coriander','turmeric','cinnamon','nutmeg','clove','allspice','cardamom','ginger powder','garlic powder','onion powder','chili powder','curry','oregano','fennel seed','mustard seed','caraway','anise','star anise','saffron','vanilla','extract','seasoning','spice','rub','herb','italian seasoning','old bay','cajun','ranch','packet']
  },
  {
    key: 'condiments', label: 'Oils, Sauces & Condiments', icon: '🫗', color: '#4a6b8a',
    keywords: ['oil','olive oil','vegetable oil','canola oil','coconut oil','sesame oil','lard','shortening','vinegar','apple cider vinegar','balsamic','wine vinegar','rice vinegar','soy sauce','worcestershire','hot sauce','tabasco','sriracha','ketchup','mustard','mayonnaise','bbq sauce','teriyaki','fish sauce','oyster sauce','hoisin','miso','tahini','peanut butter','almond butter','nut butter','white wine','red wine','beer','bourbon','whiskey','rum','brandy','wine','sherry','marsala','champagne','sauce','dressing','glaze','marinade']
  },
  {
    key: 'other', label: 'Other', icon: '🛒', color: '#666666',
    keywords: []
  }
];

export function categorizeIngredient(name) {
  const lower = name.toLowerCase();
  for (const cat of GROCERY_CATEGORIES) {
    if (cat.key === 'other') continue;
    if (cat.keywords.some(kw => lower.includes(kw))) return cat.key;
  }
  return 'other';
}
