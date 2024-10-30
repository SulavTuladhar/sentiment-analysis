from flask import Flask, render_template, request, jsonify  
import pickle
import re
import nltk
from nltk.stem.porter import PorterStemmer
from nltk.corpus import stopwords

app = Flask(__name__)

with open('clf.pkl', 'rb') as f:
    clf = pickle.load(f)
with open('tfidf.pkl', 'rb') as f:
    tfidf = pickle.load(f)

stopwords_set = set(stopwords.words('english'))
emoticon_pattern = re.compile(r'(?::|;|=)(?:-)?(?:\)|\(|D|P)')  

def preprocessing(text):
    text = re.sub(r'<[^>]*>', '', text)  
    emojis = emoticon_pattern.findall(text)  
    text = re.sub(r'[\W+]', ' ', text.lower()) + ' '.join(emojis).replace('-', '')  
    
    prter = PorterStemmer()
    text = [prter.stem(word) for word in text.split() if word not in stopwords_set]

    return " ".join(text)

@app.route('/', methods=['POST'])
def analyze_sentiment():
    data = request.json  

    reviews = data.get('data')
    if not isinstance(reviews, list):
        return jsonify({'error': 'Invalid data format: Expected a list of objects with reviewText'}), 400

    results = []
    positive_count = 0
    negative_count = 0

    for item in reviews:
        if isinstance(item, dict):  
            comment = item.get('reviewText')
            if comment:
                preprocessed_comment = preprocessing(comment)
                comment_vector = tfidf.transform([preprocessed_comment])
                sentiment = clf.predict(comment_vector)[0]  

                if sentiment == 1:  
                    positive_count += 1
                elif sentiment == 0:  
                    negative_count += 1

                results.append({'reviewText': comment, 'sentiment': int(sentiment)})
            else:
                results.append({'error': 'reviewText field is missing'})
        else:
            results.append({'error': 'Each item should be an object with reviewText'})

    total_reviews = positive_count + negative_count
    avg_positive = round((positive_count / total_reviews) * 100, 2) if total_reviews > 0 else 0
    avg_negative = round((negative_count / total_reviews) * 100, 2) if total_reviews > 0 else 0

    return jsonify({
        # 'received_data': results,
        'summary': {
            'positive_count': positive_count,
            'negative_count': negative_count,
            'average_positive': avg_positive,
            'average_negative': avg_negative
        }
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
