#!/usr/bin/env python3
"""
Dapper PWA — Insert all 7 rust PATTERN_MATRIX entries
Run from anywhere: python3 add_rust_patterns.py
"""

import sys

filepath = '/Users/jonathan/Desktop/dapper - deploy/src/Dapper.jsx'
anchor = '\n}\n\n// \u2500\u2500\u2500 Auto-generate remaining'

new_entries = """
  "rust|solid": {
    suit: { color: "Rust", pattern: "Solid", fabric: "Wool Crepe", weight: "Mid-weight", cut: "Slim" },
    shirts: [
      {
        color: "Crisp White", fabric: "Poplin", collar: "Spread",
        ties: [
          { color: "Deep Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Ivory Cream", fabric: "Silk Jacquard", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Burgundy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Woven Silk", pattern: "Micro-Dot", width: "3-inch", knot: "Pratt" },
          { color: "Mustard Gold", fabric: "Silk Twill", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Sharp Contrast", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Ribbed" },
          { label: "Earthy Anchor", pocket: "Forest Green Silk", shoes: "Olive Suede Derby", belt: "Tan Leather", socks: "Olive Cotton" },
          { label: "Warm Ivory", pocket: "Ivory Paisley", shoes: "Cognac Brogue", belt: "Cognac Leather", socks: "Cream Wool" },
          { label: "Deep Burgundy", pocket: "Burgundy Grenadine", shoes: "Oxblood Loafer", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Chocolate Earth", pocket: "Brown Silk Square", shoes: "Dark Tan Monk", belt: "Brown Leather", socks: "Chocolate Ribbed" },
          { label: "Gold Warmth", pocket: "Mustard Linen Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "Gold Cotton" }
        ],
        styleMantra: "Rust solid against crisp white is a bold, confident statement — warm, unapologetic, and entirely intentional."
      },
      {
        color: "Warm Cream", fabric: "Broadcloth", collar: "Semi-Spread",
        ties: [
          { color: "Deep Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Dark Chocolate", fabric: "Woven Silk", pattern: "Stripe", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Olive", fabric: "Knit Silk", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Silk Jacquard", pattern: "Floral", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Camel", fabric: "Cashmere Blend", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" }
        ],
        packages: [
          { label: "Tonal Warmth", pocket: "Cream Silk Square", shoes: "Cognac Oxford", belt: "Cognac Leather", socks: "Camel Wool" },
          { label: "Chocolate & Rust", pocket: "Brown Linen Fold", shoes: "Dark Brown Derby", belt: "Dark Brown Leather", socks: "Brown Ribbed" },
          { label: "Forest Floor", pocket: "Green Silk Square", shoes: "Dark Olive Derby", belt: "Olive Leather", socks: "Forest Green" },
          { label: "Autumn Olive", pocket: "Olive Pocket Square", shoes: "Tan Oxford", belt: "Tan Leather", socks: "Olive Fine Knit" },
          { label: "Burgundy Bloom", pocket: "Burgundy Floral Silk", shoes: "Oxblood Monk Strap", belt: "Oxblood Leather", socks: "Burgundy Ribbed" },
          { label: "Camel Monochrome", pocket: "Camel Linen Fold", shoes: "Camel Suede Loafer", belt: "Tan Leather", socks: "Sand Cotton" }
        ],
        styleMantra: "Cream softens rust into something deeply wearable — like autumn light at golden hour, effortlessly warm."
      },
      {
        color: "Pale Blue", fabric: "Pinpoint Oxford", collar: "Button-Down",
        ties: [
          { color: "Dark Navy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burnt Orange", fabric: "Silk Twill", pattern: "Stripe", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Silk Twill", pattern: "Repp Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Mustard", fabric: "Woven Silk", pattern: "Geometric", width: "3-inch", knot: "Pratt" }
        ],
        packages: [
          { label: "Cool & Warm", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Ribbed" },
          { label: "Warm Stripe", pocket: "Orange Silk Square", shoes: "Cognac Brogue", belt: "Cognac Leather", socks: "Rust Cotton" },
          { label: "Earth Dot", pocket: "Brown Silk Fold", shoes: "Dark Tan Derby", belt: "Brown Leather", socks: "Chocolate Cotton" },
          { label: "Green Knit", pocket: "Green Pocket Square", shoes: "Olive Suede Derby", belt: "Olive Leather", socks: "Forest Green" },
          { label: "Burgundy Repp", pocket: "Burgundy Linen Square", shoes: "Oxblood Oxford", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Mustard Geo", pocket: "Mustard Cotton Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "Gold Ribbed" }
        ],
        styleMantra: "Pale blue cools rust to perfection — the complementary contrast every warm-toned suit craves."
      }
    ]
  },

  "rust|chalk_stripe": {
    suit: { color: "Rust", pattern: "Chalk Stripe", fabric: "Wool Flannel", weight: "Mid-weight", cut: "Classic" },
    shirts: [
      {
        color: "Crisp White", fabric: "Poplin", collar: "Spread",
        ties: [
          { color: "Deep Navy", fabric: "Silk Twill", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Ivory", fabric: "Silk Jacquard", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Stripe", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Chocolate Brown", fabric: "Silk Twill", pattern: "Dot", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Mustard Gold", fabric: "Woven Silk", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Classic Authority", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Wool" },
          { label: "Ivory Elegance", pocket: "Ivory Paisley Silk", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" },
          { label: "Green Stripe", pocket: "Forest Green Silk", shoes: "Olive Derby", belt: "Olive Leather", socks: "Green Fine Knit" },
          { label: "Burgundy Richness", pocket: "Burgundy Grenadine", shoes: "Oxblood Brogue", belt: "Oxblood Leather", socks: "Burgundy Ribbed" },
          { label: "Earthy Dot", pocket: "Brown Silk Square", shoes: "Dark Tan Monk", belt: "Brown Leather", socks: "Chocolate Wool" },
          { label: "Gold Statement", pocket: "Mustard Linen Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "Mustard Cotton" }
        ],
        styleMantra: "Rust chalk stripe carries old-world gravitas — warm, structured, and quietly commanding."
      },
      {
        color: "Warm Cream", fabric: "Broadcloth", collar: "Semi-Spread",
        ties: [
          { color: "Dark Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Woven Silk", pattern: "Repp Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Burnt Orange", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Silk Jacquard", pattern: "Floral", width: "3-inch", knot: "Half Windsor" },
          { color: "Olive", fabric: "Woven Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Forest Green", fabric: "Grenadine Silk", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Tonal Classic", pocket: "Cream Silk Fold", shoes: "Tan Oxford", belt: "Tan Leather", socks: "Camel Wool" },
          { label: "Brown Repp", pocket: "Brown Linen Fold", shoes: "Dark Brown Derby", belt: "Brown Leather", socks: "Chocolate Ribbed" },
          { label: "Monochrome Warmth", pocket: "Rust Silk Square", shoes: "Cognac Loafer", belt: "Cognac Leather", socks: "Rust Cotton" },
          { label: "Burgundy Bloom", pocket: "Burgundy Floral Silk", shoes: "Oxblood Oxford", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Olive Earth", pocket: "Olive Linen Fold", shoes: "Tan Suede Derby", belt: "Tan Leather", socks: "Olive Cotton" },
          { label: "Green Elegance", pocket: "Green Grenadine Fold", shoes: "Dark Olive Monk", belt: "Olive Leather", socks: "Forest Green" }
        ],
        styleMantra: "Cream and rust chalk stripe is autumn personified — rich, textured, and beautifully cohesive."
      },
      {
        color: "Light Blue", fabric: "Chambray", collar: "Button-Down",
        ties: [
          { color: "Deep Navy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Silk Twill", pattern: "Dot", width: "3-inch", knot: "Half Windsor" },
          { color: "Burgundy", fabric: "Woven Silk", pattern: "Repp Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Mustard", fabric: "Silk Twill", pattern: "Geometric", width: "3-inch", knot: "Pratt" },
          { color: "Ivory", fabric: "Woven Silk", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Cool Authority", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Ribbed" },
          { label: "Earthy Dot", pocket: "Brown Silk Fold", shoes: "Tan Brogue", belt: "Brown Leather", socks: "Chocolate Cotton" },
          { label: "Burgundy Repp", pocket: "Burgundy Pocket Square", shoes: "Oxblood Oxford", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Green Knit Casual", pocket: "Green Linen Fold", shoes: "Olive Suede Derby", belt: "Olive Leather", socks: "Green Cotton" },
          { label: "Mustard Pop", pocket: "Mustard Silk Square", shoes: "Tan Loafer", belt: "Tan Leather", socks: "Gold Ribbed" },
          { label: "Ivory Paisley", pocket: "Ivory Paisley Silk", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Chambray blue brings a relaxed intelligence to rust chalk stripe — casual authority at its finest."
      }
    ]
  },

  "rust|glen_plaid": {
    suit: { color: "Rust", pattern: "Glen Plaid", fabric: "Wool Tweed", weight: "Mid-weight", cut: "Classic" },
    shirts: [
      {
        color: "Crisp White", fabric: "Poplin", collar: "Spread",
        ties: [
          { color: "Dark Navy", fabric: "Silk Twill", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Burgundy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Silk Twill", pattern: "Stripe", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Ivory", fabric: "Silk Jacquard", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Mustard Gold", fabric: "Woven Silk", pattern: "Solid", width: "3-inch", knot: "Pratt" }
        ],
        packages: [
          { label: "Country Gentleman", pocket: "White Linen Square", shoes: "Dark Brown Brogue", belt: "Dark Brown Leather", socks: "Navy Wool" },
          { label: "Burgundy Heritage", pocket: "Burgundy Grenadine", shoes: "Oxblood Brogue", belt: "Oxblood Leather", socks: "Burgundy Ribbed" },
          { label: "Green Country", pocket: "Forest Green Silk", shoes: "Dark Olive Derby", belt: "Olive Leather", socks: "Green Wool" },
          { label: "Brown Earth", pocket: "Brown Silk Fold", shoes: "Tan Brogue", belt: "Brown Leather", socks: "Chocolate Ribbed" },
          { label: "Ivory Paisley", pocket: "Ivory Silk Paisley", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" },
          { label: "Mustard Accent", pocket: "Mustard Linen Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "Mustard Cotton" }
        ],
        styleMantra: "Rust glen plaid is countryside aristocracy — worn by men who know exactly who they are."
      },
      {
        color: "Warm Cream", fabric: "Oxford Cloth", collar: "Semi-Spread",
        ties: [
          { color: "Dark Navy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Woven Silk", pattern: "Repp Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Silk Jacquard", pattern: "Floral", width: "3-inch", knot: "Half Windsor" },
          { color: "Burnt Orange", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Olive", fabric: "Woven Silk", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Warm Heritage", pocket: "Cream Linen Square", shoes: "Dark Tan Brogue", belt: "Tan Leather", socks: "Camel Wool" },
          { label: "Brown Repp", pocket: "Brown Silk Fold", shoes: "Dark Brown Derby", belt: "Brown Leather", socks: "Chocolate Wool" },
          { label: "Green Knit Country", pocket: "Green Linen Fold", shoes: "Olive Derby", belt: "Olive Leather", socks: "Forest Green" },
          { label: "Burgundy Bloom", pocket: "Burgundy Floral Silk", shoes: "Oxblood Monk", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Tonal Autumn", pocket: "Rust Silk Square", shoes: "Cognac Loafer", belt: "Cognac Leather", socks: "Rust Cotton" },
          { label: "Olive Earth", pocket: "Olive Pocket Square", shoes: "Tan Suede Derby", belt: "Tan Leather", socks: "Olive Cotton" }
        ],
        styleMantra: "Cream lifts the rust glen plaid into refined countryside elegance — heritage without the stiffness."
      },
      {
        color: "Pale Blue", fabric: "Pinpoint Oxford", collar: "Button-Down",
        ties: [
          { color: "Dark Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Mustard", fabric: "Silk Twill", pattern: "Stripe", width: "3-inch", knot: "Pratt" },
          { color: "Ivory", fabric: "Woven Silk", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Blue & Rust Country", pocket: "White Linen Square", shoes: "Dark Brown Brogue", belt: "Dark Brown Leather", socks: "Navy Ribbed" },
          { label: "Burgundy Refinement", pocket: "Burgundy Linen Square", shoes: "Oxblood Brogue", belt: "Oxblood Leather", socks: "Burgundy Wool" },
          { label: "Green Dot Casual", pocket: "Green Pocket Square", shoes: "Olive Suede Derby", belt: "Olive Leather", socks: "Green Cotton" },
          { label: "Brown Knit Easy", pocket: "Brown Silk Fold", shoes: "Tan Derby", belt: "Brown Leather", socks: "Chocolate Cotton" },
          { label: "Mustard Stripe", pocket: "Mustard Silk Square", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "Gold Cotton" },
          { label: "Ivory Paisley", pocket: "Ivory Silk Paisley", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Blue oxford with rust glen plaid bridges casual and country — relaxed sophistication for the modern man."
      }
    ]
  },

  "rust|herringbone": {
    suit: { color: "Rust", pattern: "Herringbone", fabric: "Wool Flannel", weight: "Mid-weight", cut: "Slim" },
    shirts: [
      {
        color: "Crisp White", fabric: "Poplin", collar: "Spread",
        ties: [
          { color: "Deep Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Chocolate Brown", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Woven Silk", pattern: "Repp Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Mustard Gold", fabric: "Woven Silk", pattern: "Geometric", width: "3-inch", knot: "Pratt" },
          { color: "Ivory", fabric: "Silk Jacquard", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Sharp Herringbone", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Ribbed" },
          { label: "Earth Grenadine", pocket: "Brown Silk Fold", shoes: "Dark Tan Derby", belt: "Brown Leather", socks: "Chocolate Wool" },
          { label: "Burgundy Repp", pocket: "Burgundy Linen Square", shoes: "Oxblood Brogue", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Forest Accent", pocket: "Forest Green Silk", shoes: "Olive Derby", belt: "Olive Leather", socks: "Green Ribbed" },
          { label: "Mustard Geometry", pocket: "Mustard Pocket Square", shoes: "Tan Loafer", belt: "Tan Leather", socks: "Gold Cotton" },
          { label: "Ivory Paisley", pocket: "Ivory Paisley Silk", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Rust herringbone in white shows confidence — the subtle weave adds depth while white keeps you sharp."
      },
      {
        color: "Warm Cream", fabric: "Broadcloth", collar: "Semi-Spread",
        ties: [
          { color: "Dark Navy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Half Windsor" },
          { color: "Burnt Orange", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Olive", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Woven Silk", pattern: "Floral", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Grenadine Silk", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Warm Texture", pocket: "Cream Silk Fold", shoes: "Cognac Oxford", belt: "Tan Leather", socks: "Camel Wool" },
          { label: "Brown Dot Earth", pocket: "Brown Linen Fold", shoes: "Dark Brown Derby", belt: "Brown Leather", socks: "Chocolate Ribbed" },
          { label: "Tonal Rust", pocket: "Rust Silk Square", shoes: "Cognac Loafer", belt: "Cognac Leather", socks: "Rust Cotton" },
          { label: "Olive Warmth", pocket: "Olive Pocket Square", shoes: "Tan Suede Derby", belt: "Tan Leather", socks: "Olive Fine Knit" },
          { label: "Burgundy Floral", pocket: "Burgundy Floral Silk", shoes: "Oxblood Monk", belt: "Oxblood Leather", socks: "Burgundy Ribbed" },
          { label: "Green Grenadine", pocket: "Green Grenadine Fold", shoes: "Dark Olive Oxford", belt: "Olive Leather", socks: "Forest Green" }
        ],
        styleMantra: "Cream and rust herringbone is warm-toned mastery — textured, autumnal, and thoroughly modern."
      },
      {
        color: "Light Blue", fabric: "Chambray", collar: "Button-Down",
        ties: [
          { color: "Deep Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Half Windsor" },
          { color: "Burgundy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Mustard", fabric: "Silk Twill", pattern: "Stripe", width: "3-inch", knot: "Pratt" },
          { color: "Ivory", fabric: "Woven Silk", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Cool Contrast", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Cotton" },
          { label: "Brown Dot Casual", pocket: "Brown Silk Fold", shoes: "Tan Brogue", belt: "Brown Leather", socks: "Chocolate Cotton" },
          { label: "Burgundy Grenadine", pocket: "Burgundy Pocket Square", shoes: "Oxblood Oxford", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Green Knit Ease", pocket: "Green Linen Fold", shoes: "Olive Suede Derby", belt: "Olive Leather", socks: "Green Cotton" },
          { label: "Mustard Stripe Pop", pocket: "Mustard Silk Square", shoes: "Tan Loafer", belt: "Tan Leather", socks: "Gold Ribbed" },
          { label: "Ivory Softness", pocket: "Ivory Paisley Silk", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Chambray blue against rust herringbone is complementary contrast done right — cool meets warm, texture meets ease."
      }
    ]
  },

  "rust|tweed": {
    suit: { color: "Rust", pattern: "Tweed", fabric: "Harris Tweed", weight: "Heavy", cut: "Classic" },
    shirts: [
      {
        color: "Crisp White", fabric: "Poplin", collar: "Spread",
        ties: [
          { color: "Dark Navy", fabric: "Grenadine Silk", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Silk Twill", pattern: "Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Burgundy", fabric: "Woven Silk", pattern: "Floral", width: "3-inch", knot: "Half Windsor" },
          { color: "Mustard Gold", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Ivory", fabric: "Silk Jacquard", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Tweed Authority", pocket: "White Linen Square", shoes: "Dark Brown Brogue", belt: "Dark Brown Leather", socks: "Navy Wool" },
          { label: "Green Country", pocket: "Forest Green Silk", shoes: "Dark Olive Brogue", belt: "Olive Leather", socks: "Green Wool" },
          { label: "Brown Stripe Heritage", pocket: "Brown Silk Fold", shoes: "Dark Tan Derby", belt: "Brown Leather", socks: "Chocolate Wool" },
          { label: "Burgundy Bloom", pocket: "Burgundy Floral Silk", shoes: "Oxblood Brogue", belt: "Oxblood Leather", socks: "Burgundy Ribbed" },
          { label: "Mustard Knit", pocket: "Mustard Wool Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "Mustard Wool" },
          { label: "Ivory Paisley", pocket: "Ivory Silk Paisley", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Rust tweed is raw countryside elegance — heavy, textured, and unapologetically handsome."
      },
      {
        color: "Warm Cream", fabric: "Oxford Cloth", collar: "Semi-Spread",
        ties: [
          { color: "Dark Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Repp Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Olive", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Silk Jacquard", pattern: "Paisley", width: "3-inch", knot: "Half Windsor" },
          { color: "Burnt Orange", fabric: "Woven Silk", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Cream Tweed Warmth", pocket: "Cream Linen Square", shoes: "Cognac Brogue", belt: "Cognac Leather", socks: "Camel Wool" },
          { label: "Brown Grenadine", pocket: "Brown Silk Fold", shoes: "Dark Brown Derby", belt: "Brown Leather", socks: "Chocolate Wool" },
          { label: "Green Repp Country", pocket: "Green Pocket Square", shoes: "Dark Olive Brogue", belt: "Olive Leather", socks: "Forest Green Wool" },
          { label: "Olive Knit Natural", pocket: "Olive Wool Fold", shoes: "Tan Suede Derby", belt: "Tan Leather", socks: "Olive Wool" },
          { label: "Burgundy Paisley", pocket: "Burgundy Silk Paisley", shoes: "Oxblood Monk", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Tonal Autumn", pocket: "Rust Wool Square", shoes: "Cognac Loafer", belt: "Cognac Leather", socks: "Rust Wool" }
        ],
        styleMantra: "Cream anchors the warmth of rust tweed — all the ruggedness of the countryside, all the refinement of a gentleman."
      },
      {
        color: "Pale Blue", fabric: "Pinpoint Oxford", collar: "Button-Down",
        ties: [
          { color: "Dark Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Mustard", fabric: "Silk Twill", pattern: "Geometric", width: "3-inch", knot: "Pratt" },
          { color: "Ivory", fabric: "Silk Jacquard", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Blue & Tweed", pocket: "White Linen Square", shoes: "Dark Brown Brogue", belt: "Dark Brown Leather", socks: "Navy Wool" },
          { label: "Brown Grenadine Casual", pocket: "Brown Linen Fold", shoes: "Tan Brogue", belt: "Brown Leather", socks: "Chocolate Cotton" },
          { label: "Burgundy Dot", pocket: "Burgundy Pocket Square", shoes: "Oxblood Brogue", belt: "Oxblood Leather", socks: "Burgundy Ribbed" },
          { label: "Green Knit Country", pocket: "Green Wool Fold", shoes: "Olive Suede Derby", belt: "Olive Leather", socks: "Forest Green" },
          { label: "Mustard Geometry", pocket: "Mustard Wool Square", shoes: "Tan Loafer", belt: "Tan Leather", socks: "Mustard Cotton" },
          { label: "Ivory Refined", pocket: "Ivory Silk Paisley", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Blue oxford with rust tweed is the unexpected pairing that works every time — cool restraint, warm texture."
      }
    ]
  },

  "rust|linen": {
    suit: { color: "Rust", pattern: "Linen", fabric: "Italian Linen", weight: "Light", cut: "Relaxed" },
    shirts: [
      {
        color: "Crisp White", fabric: "Linen", collar: "Spread",
        ties: [
          { color: "Dark Navy", fabric: "Woven Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Tan", fabric: "Linen Blend", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Forest Green", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Ivory", fabric: "Silk Twill", pattern: "Dot", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Woven Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Mustard", fabric: "Linen Blend", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" }
        ],
        packages: [
          { label: "Summer Crisp", pocket: "White Linen Square", shoes: "White Leather Derby", belt: "White Leather", socks: "No-Show White" },
          { label: "Tan Linen Easy", pocket: "Tan Linen Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "No-Show Nude" },
          { label: "Green Knit Warm", pocket: "Green Linen Square", shoes: "Olive Leather Loafer", belt: "Olive Leather", socks: "No-Show Green" },
          { label: "Ivory Dot Warm", pocket: "Ivory Linen Fold", shoes: "Cream Leather Derby", belt: "Tan Leather", socks: "No-Show Cream" },
          { label: "Burgundy Summer", pocket: "Burgundy Linen Square", shoes: "Oxblood Derby", belt: "Oxblood Leather", socks: "No-Show White" },
          { label: "Mustard Linen Ease", pocket: "Mustard Linen Fold", shoes: "Tan Loafer", belt: "Tan Leather", socks: "No-Show Nude" }
        ],
        styleMantra: "Rust linen with white is summer sophistication — warm, breezy, and effortlessly put-together."
      },
      {
        color: "Warm Cream", fabric: "Linen", collar: "Open Collar",
        ties: [
          { color: "None (Open Collar)", fabric: "", pattern: "No Tie", width: "", knot: "" },
          { color: "Tan", fabric: "Linen Blend", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Olive", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burnt Orange", fabric: "Linen Blend", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Ivory", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" }
        ],
        packages: [
          { label: "Barefoot Elegance", pocket: "Cream Linen Square", shoes: "Tan Leather Espadrille", belt: "None", socks: "No-Show Nude" },
          { label: "Tan Warmth", pocket: "Tan Linen Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "No-Show Nude" },
          { label: "Olive Ease", pocket: "Olive Linen Square", shoes: "Olive Leather Derby", belt: "Olive Leather", socks: "No-Show White" },
          { label: "Green Warmth", pocket: "Green Pocket Square", shoes: "Forest Green Loafer", belt: "Olive Leather", socks: "No-Show White" },
          { label: "Tonal Rust", pocket: "Rust Linen Square", shoes: "Cognac Loafer", belt: "Cognac Leather", socks: "No-Show Nude" },
          { label: "Ivory Linen Tonal", pocket: "Ivory Silk Fold", shoes: "Cream Derby", belt: "Tan Leather", socks: "No-Show Cream" }
        ],
        styleMantra: "Cream linen open-collar with rust is Amalfi-coast energy — relaxed luxury in the warmest palette."
      },
      {
        color: "Light Blue", fabric: "Linen", collar: "Open Collar",
        ties: [
          { color: "None (Open Collar)", fabric: "", pattern: "No Tie", width: "", knot: "" },
          { color: "Dark Navy", fabric: "Woven Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Tan", fabric: "Linen Blend", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "White", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Mustard", fabric: "Linen Blend", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Forest Green", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" }
        ],
        packages: [
          { label: "Coastal Cool", pocket: "White Linen Square", shoes: "White Canvas Espadrille", belt: "None", socks: "No-Show White" },
          { label: "Navy Anchor", pocket: "Navy Linen Fold", shoes: "Navy Canvas Derby", belt: "Dark Brown Leather", socks: "No-Show Navy" },
          { label: "Tan Easy", pocket: "Tan Linen Square", shoes: "Tan Leather Loafer", belt: "Tan Leather", socks: "No-Show Nude" },
          { label: "White Knit Light", pocket: "White Cotton Fold", shoes: "White Leather Derby", belt: "Tan Leather", socks: "No-Show White" },
          { label: "Mustard Pop", pocket: "Mustard Linen Fold", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "No-Show Nude" },
          { label: "Green Coastal", pocket: "Green Linen Square", shoes: "Olive Leather Derby", belt: "Olive Leather", socks: "No-Show White" }
        ],
        styleMantra: "Blue linen with rust linen is complementary summer harmony — the kind of look that belongs near the water."
      }
    ]
  },

  "rust|houndstooth": {
    suit: { color: "Rust", pattern: "Houndstooth", fabric: "Wool Blend", weight: "Mid-weight", cut: "Slim" },
    shirts: [
      {
        color: "Crisp White", fabric: "Poplin", collar: "Spread",
        ties: [
          { color: "Dark Navy", fabric: "Silk Twill", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Burgundy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Silk Twill", pattern: "Stripe", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Mustard Gold", fabric: "Woven Silk", pattern: "Geometric", width: "3-inch", knot: "Pratt" },
          { color: "Ivory", fabric: "Silk Jacquard", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Bold Houndstooth", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Ribbed" },
          { label: "Burgundy Warmth", pocket: "Burgundy Grenadine Fold", shoes: "Oxblood Brogue", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Green Dot Accent", pocket: "Forest Green Silk", shoes: "Dark Olive Derby", belt: "Olive Leather", socks: "Green Ribbed" },
          { label: "Brown Stripe Earth", pocket: "Brown Silk Fold", shoes: "Tan Brogue", belt: "Brown Leather", socks: "Chocolate Ribbed" },
          { label: "Mustard Statement", pocket: "Mustard Linen Square", shoes: "Tan Suede Loafer", belt: "Tan Leather", socks: "Mustard Cotton" },
          { label: "Ivory Paisley", pocket: "Ivory Silk Paisley", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Rust houndstooth makes a statement before you open your mouth — bold pattern, bolder confidence."
      },
      {
        color: "Warm Cream", fabric: "Broadcloth", collar: "Semi-Spread",
        ties: [
          { color: "Dark Navy", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Woven Silk", pattern: "Dot", width: "3-inch", knot: "Half Windsor" },
          { color: "Burnt Orange", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Forest Green", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Silk Jacquard", pattern: "Floral", width: "3-inch", knot: "Half Windsor" },
          { color: "Olive", fabric: "Woven Silk", pattern: "Solid", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Warm Houndstooth", pocket: "Cream Linen Square", shoes: "Cognac Oxford", belt: "Tan Leather", socks: "Camel Wool" },
          { label: "Brown Dot Rich", pocket: "Brown Silk Fold", shoes: "Dark Brown Derby", belt: "Brown Leather", socks: "Chocolate Ribbed" },
          { label: "Tonal Rust", pocket: "Rust Silk Square", shoes: "Cognac Loafer", belt: "Cognac Leather", socks: "Rust Cotton" },
          { label: "Forest Solid", pocket: "Forest Green Linen Fold", shoes: "Dark Olive Oxford", belt: "Olive Leather", socks: "Forest Green" },
          { label: "Burgundy Floral", pocket: "Burgundy Floral Silk", shoes: "Oxblood Monk", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Olive Warmth", pocket: "Olive Pocket Square", shoes: "Tan Suede Derby", belt: "Tan Leather", socks: "Olive Fine Knit" }
        ],
        styleMantra: "Cream softens rust houndstooth into wearable art — pattern-forward dressing that still feels approachable."
      },
      {
        color: "Light Blue", fabric: "Chambray", collar: "Button-Down",
        ties: [
          { color: "Deep Navy", fabric: "Silk Twill", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Chocolate Brown", fabric: "Grenadine Silk", pattern: "Solid", width: "3-inch", knot: "Four-in-Hand" },
          { color: "Burgundy", fabric: "Woven Silk", pattern: "Repp Stripe", width: "3.25-inch", knot: "Half Windsor" },
          { color: "Forest Green", fabric: "Silk Knit", pattern: "Solid", width: "2.75-inch", knot: "Four-in-Hand" },
          { color: "Mustard", fabric: "Silk Twill", pattern: "Geometric", width: "3-inch", knot: "Pratt" },
          { color: "Ivory", fabric: "Woven Silk", pattern: "Paisley", width: "3.25-inch", knot: "Half Windsor" }
        ],
        packages: [
          { label: "Cool Houndstooth", pocket: "White Linen Square", shoes: "Dark Brown Oxford", belt: "Dark Brown Leather", socks: "Navy Cotton" },
          { label: "Brown Grenadine", pocket: "Brown Silk Fold", shoes: "Tan Brogue", belt: "Brown Leather", socks: "Chocolate Cotton" },
          { label: "Burgundy Repp", pocket: "Burgundy Pocket Square", shoes: "Oxblood Oxford", belt: "Oxblood Leather", socks: "Burgundy Fine Knit" },
          { label: "Green Knit Ease", pocket: "Green Linen Fold", shoes: "Olive Suede Derby", belt: "Olive Leather", socks: "Green Cotton" },
          { label: "Mustard Pattern Play", pocket: "Mustard Silk Square", shoes: "Tan Loafer", belt: "Tan Leather", socks: "Gold Ribbed" },
          { label: "Ivory Refined", pocket: "Ivory Silk Paisley", shoes: "Cognac Cap-Toe", belt: "Cognac Leather", socks: "Cream Wool" }
        ],
        styleMantra: "Light blue chambray with rust houndstooth is the relaxed dapper move — pattern energy, cool shirt confidence."
      }
    ]
  },
"""

# ── Read file ──────────────────────────────────────────────────────────────
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# ── Safety checks ──────────────────────────────────────────────────────────
if anchor not in content:
    print("ERROR: Anchor not found. Check that the Unicode em-dashes are intact.")
    sys.exit(1)

if '"rust|solid"' in content:
    print("WARNING: rust entries already exist in file — aborting to avoid duplicates.")
    sys.exit(1)

# ── Insert ─────────────────────────────────────────────────────────────────
new_content = content.replace(anchor, new_entries + anchor, 1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: All 7 rust patterns inserted.")
print(f"File size: {len(new_content):,} characters")
print()
print("Next step — wire up detection, then deploy:")
print("  python3 add_rust_detection.py")
print("  npm run build && git add -A && git commit -m 'feat: add rust color family (7 patterns)' && git push origin main")
