var Liquid = window.liquidjs.Liquid
var engine = new Liquid({
  extname: '.html',
  cache: true
});
var src = "<h2>Welcome to {{ name | capitalize}}, {% include 'date.html' %}</h2>";
var ctx = {
  name: 'Liquid',
  date: new Date()
};
engine.parseAndRender(src, ctx).then(function(html) {
    document.body.innerHTML = html
});