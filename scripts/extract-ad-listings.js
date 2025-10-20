const fs = require('fs');

// Read the JSON file
const jsonData = JSON.parse(fs.readFileSync('wp_posts.json', 'utf8'));

// Find the table data section
const tableData = jsonData.find(item => item.type === 'table' && item.name === 'wp_posts');

if (!tableData) {
  console.error('Could not find wp_posts table data');
  process.exit(1);
}

// Filter only ad_listing posts
const adListings = tableData.data.filter(post => post.post_type === 'ad_listing');

console.log(`Found ${adListings.length} ad_listing posts`);

// Create the output structure
const output = [
  {"type":"header","version":"5.2.3","comment":"Export to JSON plugin for phpMyAdmin - Ad Listings Only"},
  {"type":"database","name":"gratiskittens_com"},
  {"type":"table","name":"wp_posts","database":"gratiskittens_com","data": adListings}
];

// Write to file
fs.writeFileSync('ad_listings_only.json', JSON.stringify(output, null, 2));

console.log(`✅ Exported ${adListings.length} ad_listing posts to ad_listings_only.json`);

// Show some sample data
console.log('\nSample ad listings:');
adListings.slice(0, 3).forEach((post, index) => {
  console.log(`${index + 1}. ID: ${post.ID}, Title: ${post.post_title}, Date: ${post.post_date}`);
});
