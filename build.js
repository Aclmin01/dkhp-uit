/**
 * ==============================================================================
 * ENTERPRISE PRODUCTION BUNDLER & SECURITY OBFUSCATION ENGINE
 * ==============================================================================
 * Bundles, minifies, mangles, and strips comments from all frontend modules.
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function build() {
  console.log('🚀 Starting DKHP UIT Enterprise Security Build...');

  // If local source files are not present, use pre-bundled production assets
  if (!fs.existsSync(path.join(__dirname, 'security-guard.js')) && fs.existsSync(path.join(__dirname, 'bundle.main.min.js'))) {
    console.log('⚡ Pre-compiled production bundles found. Ready for deployment!');
    return;
  }

  const terserOptions = {
    compress: {
      dead_code: true,
      drop_debugger: false, // Keep security watchdog probe
      conditionals: true,
      evaluate: true,
      booleans: true,
      loops: true,
      unused: true,
      hoist_funs: true,
      keep_fargs: false,
      hoist_vars: true,
      if_return: true,
      join_vars: true,
      collapse_vars: true,
      reduce_vars: true
    },
    mangle: {
      toplevel: false,
      eval: true
    },
    format: {
      comments: false,
      beautify: false,
      ascii_only: true
    }
  };

  // 1. Bundle Main App (index.html)
  console.log('📦 Bundling main app (bundle.main.min.js)...');
  const mainFiles = [
    'security-guard.js',
    'security.js',
    'ratings.js',
    'data.js',
    'app.js'
  ];

  let mainSource = '';
  for (const file of mainFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      mainSource += fs.readFileSync(filePath, 'utf8') + '\n;\n';
    } else {
      console.warn(`⚠️ Warning: ${file} not found.`);
    }
  }

  const minifiedMain = await minify(mainSource, terserOptions);
  fs.writeFileSync(path.join(__dirname, 'bundle.main.min.js'), minifiedMain.code, 'utf8');
  console.log(`✅ Generated bundle.main.min.js (${(minifiedMain.code.length / 1024).toFixed(2)} KB)`);

  // 2. Bundle Reviews App (reviews.html)
  console.log('📦 Bundling reviews app (bundle.reviews.min.js)...');
  const reviewFiles = [
    'security-guard.js',
    'security.js',
    'data.js',
    'ratings.js',
    'supabase-config.js',
    'reviews.js'
  ];

  let reviewSource = '';
  for (const file of reviewFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      reviewSource += fs.readFileSync(filePath, 'utf8') + '\n;\n';
    } else {
      console.warn(`⚠️ Warning: ${file} not found.`);
    }
  }

  const minifiedReviews = await minify(reviewSource, terserOptions);
  fs.writeFileSync(path.join(__dirname, 'bundle.reviews.min.js'), minifiedReviews.code, 'utf8');
  console.log(`✅ Generated bundle.reviews.min.js (${(minifiedReviews.code.length / 1024).toFixed(2)} KB)`);

  // 3. Bundle Social Feed App (feed.html)
  console.log('📦 Bundling social feed app (bundle.feed.min.js)...');
  const feedFiles = [
    'security-guard.js',
    'security.js',
    'ratings.js',
    'supabase-config.js',
    'feed.js'
  ];

  let feedSource = '';
  for (const file of feedFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      feedSource += fs.readFileSync(filePath, 'utf8') + '\n;\n';
    } else {
      console.warn(`⚠️ Warning: ${file} not found.`);
    }
  }

  const minifiedFeed = await minify(feedSource, terserOptions);
  fs.writeFileSync(path.join(__dirname, 'bundle.feed.min.js'), minifiedFeed.code, 'utf8');
  console.log(`✅ Generated bundle.feed.min.js (${(minifiedFeed.code.length / 1024).toFixed(2)} KB)`);

  console.log('🎉 Enterprise Security Build completed successfully!');
}

build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
