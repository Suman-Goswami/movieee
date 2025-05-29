#!/usr/bin/env python3


import re
import sys
import json
from urllib.parse import unquote
import requests
from bs4 import BeautifulSoup

if len(sys.argv) > 1:
    print(f'You passed: "{sys.argv[1]}"')
else:
    print("No input was provided.")

class CreditCardScraper:
  
    def __init__(self):
        self.base_url = "https://www.myrupaya.in"
        self.credit_card_page = "/copy-2-of-product-category-1-1/credit-card"
        self.card_mapping = {}
    
    def fetch_page(self, url):
     
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching page: {e}")
            return None
    
    def extract_card_links(self):
      
        full_url = self.base_url + self.credit_card_page
        html_content = self.fetch_page(full_url)
        
        if not html_content:
            return False
        
        soup = BeautifulSoup(html_content, 'html.parser')
        
        learn_more_links = [a for a in soup.find_all('a') 
                           if a.get_text().strip() == 'Learn More' 
                           and '/credit-card-products/' in a.get('href', '')]
        
        for link in learn_more_links:
            url = link.get('href')
            if not url.startswith('http'):
                url = self.base_url + url
            
            url_path = url.split('/')[-1]
            
            card_name = unquote(url_path.replace('-', ' '))
            card_name = re.sub(r'\b\w', lambda m: m.group(0).upper(), card_name)
            
            self.card_mapping[card_name] = url
        
        return len(self.card_mapping) > 0
    
    def normalize_card_name(self, card_name):
        if not card_name:
            return ""
        
        # Convert to lowercase and remove extra spaces
        normalized = card_name.lower().strip()
        
        # Remove common words that might be optional in searches
        normalized = re.sub(r'\b(credit|card|bank)\b', '', normalized)
        
        # Remove special characters and extra spaces
        normalized = re.sub(r'[^\w\s]', '', normalized)
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    def find_card_link(self, card_name):
        """Find the link for a given card name"""
        if not self.card_mapping:
            success = self.extract_card_links()
            if not success:
                return None
        
        # Try exact match first
        if card_name in self.card_mapping:
            return self.card_mapping[card_name]
        
        # Normalize the input card name
        normalized_input = self.normalize_card_name(card_name)
        
        # Try fuzzy matching
        best_match = None
        best_score = 0
        
        for db_card_name, link in self.card_mapping.items():
            normalized_db_name = self.normalize_card_name(db_card_name)
            
            # Calculate simple matching score (number of common words)
            input_words = set(normalized_input.split())
            db_words = set(normalized_db_name.split())
            common_words = input_words.intersection(db_words)
            
            score = len(common_words) / max(len(input_words), 1)
            
            if score > best_score:
                best_score = score
                best_match = link
        
        # Return the best match if score is above threshold
        if best_score >= 0.5:
            return best_match
        
        return None
    
    def get_all_cards(self):
        if not self.card_mapping:
            success = self.extract_card_links()
            if not success:
                return []
        
        return sorted(self.card_mapping.keys())

def main():
    scraper = CreditCardScraper()
    
    if len(sys.argv) < 2:
        print("Usage: python credit_card_scraper.py <card_name>")
        print("Or use --list to see all available cards")
        return
    
    if sys.argv[1] == "--list":
        # Extract all cards and print them
        scraper.extract_card_links()
        all_cards = scraper.get_all_cards()
        print("Available credit cards:")
        for i, card in enumerate(all_cards, 1):
            print(f"{i}. {card}")
        return
    
    # Get the card name from command line arguments
    card_name = " ".join(sys.argv[1:])
    
    # Find the link for the card
    link = scraper.find_card_link(card_name)
    
    if link:
        print(f"Link for '{card_name}':")
        print(link)
    else:
        print(f"No link found for '{card_name}'")
        print("Try using --list to see all available cards")

if __name__ == "__main__":
    main()
