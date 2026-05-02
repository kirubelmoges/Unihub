import random

COSMIC_MESSAGES = [
    'The stars have aligned in your favor!',
    'Cosmic forces suggest a magnetic connection.',
    'The universe whispers: this could be love.',
    'Ancient algorithms of the heart speak clearly.',
    'The mystery of love remains beautifully unresolved.',
    'Fate laughs — but not unkindly.',
    'Every great love story began with a single score.',
    'The cosmos are still deliberating on your behalf.',
    'Love is not a calculation, yet the numbers smile upon you.',
    'Your energies resonate across dimensions.',
    'The universe has taken notice of your connection.',
    'Ancient wisdom meets modern mystery in your result.',
]

class ScoringEngine:
    def calculate(self, responses, facial_profile, user_gender=None):
        facial_features = facial_profile.to_dict()
        feature_alignment = {}
        behavioral_answers = {}
        model_score = 0.0
        gender_match = True

        for response in responses:
            q_id = response.question.id
            feature_name = response.question.facial_feature
            behavioral_val = response.selected_option.value
            
            # Special handling for gender question (Question ID 1)
            if q_id == 1:  # Gender question
                # Store gender match info but don't add to score
                user_selected_gender = 'M' if behavioral_val < 50 else 'F'
                detected_gender = facial_profile.detected_gender
                
                if user_selected_gender == detected_gender:
                    gender_match = False  # Same gender detected
                continue
            
            # Normal questions
            facial_val = facial_features.get(feature_name, 50.0)
            compatibility = 100 - abs(behavioral_val - facial_val)
            weight = random.uniform(0.4, 0.6)
            question_points = (compatibility * weight * 2) / 100
            model_score += question_points

            behavioral_answers[str(q_id)] = behavioral_val
            feature_alignment[feature_name] = {
                'behavioral': behavioral_val,
                'facial': round(facial_val, 1),
                'compatibility': round(compatibility, 1),
                'points': round(question_points, 3)
            }

        model_score = min(model_score, 60.0)
        
        # Gender penalty
        gender_penalty = 0
        same_gender = False
        
        if not gender_match:
            same_gender = True
            gender_penalty = model_score * 0.2
            model_score = model_score - gender_penalty

        chance_score = float(random.randint(0, 40))
        final_score = model_score + chance_score
        is_match = final_score >= 50
        verdict = 'MATCH' if is_match else 'NO MATCH'

        cosmic_message = random.choice(COSMIC_MESSAGES)
        
        if same_gender:
            cosmic_message = f"[Gender Note] {cosmic_message}"

        return {
            'model_score': round(model_score, 2),
            'chance_score': chance_score,
            'final_score': round(final_score, 2),
            'verdict': verdict,
            'is_match': is_match,
            'behavioral_answers': behavioral_answers,
            'feature_alignment': feature_alignment,
            'cosmic_message': cosmic_message,
            'same_gender_detected': same_gender,
            'gender_penalty': round(gender_penalty, 2),
            'detected_gender': facial_profile.detected_gender,
        }