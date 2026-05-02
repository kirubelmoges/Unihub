import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from digital_library.models import Faculty, Department

# Complete Faculties and Departments Data
FACULTIES_DATA = {
    # 1. ENGINEERING
    'ENGINEERING': {
        'name': 'Faculty of Engineering',
        'icon': '🔧',
        'color': 'blue',
        'departments': [
            ('mechanical', 'Mechanical Engineering', '⚙️'),
            ('electrical', 'Electrical Engineering', '⚡'),
            ('civil', 'Civil Engineering', '🏗️'),
            ('computer', 'Computer Engineering', '💻'),
            ('chemical', 'Chemical Engineering', '🧪'),
            ('biomedical', 'Biomedical Engineering', '🫀'),
            ('aerospace', 'Aerospace Engineering', '✈️'),
            ('industrial', 'Industrial Engineering', '🏭'),
            ('materials', 'Materials Engineering', '🔬'),
            ('environmental_eng', 'Environmental Engineering', '🌱'),
            ('petroleum', 'Petroleum Engineering', '🛢️'),
            ('mining', 'Mining Engineering', '⛏️'),
            ('nuclear', 'Nuclear Engineering', '☢️'),
            ('automotive', 'Automotive Engineering', '🚗'),
            ('marine', 'Marine Engineering', '🚢'),
            ('mechatronics', 'Mechatronics Engineering', '🤖'),
        ]
    },
    
    # 2. SCIENCE
    'SCIENCE': {
        'name': 'Faculty of Science',
        'icon': '🔬',
        'color': 'green',
        'departments': [
            ('physics', 'Physics', '⚛️'),
            ('chemistry', 'Chemistry', '🧪'),
            ('biology', 'Biology', '🧬'),
            ('mathematics', 'Mathematics', '📐'),
            ('computer_science', 'Computer Science', '💻'),
            ('statistics', 'Statistics', '📊'),
            ('geology', 'Geology', '⛰️'),
            ('environmental', 'Environmental Science', '🌍'),
            ('biochemistry', 'Biochemistry', '🧫'),
            ('microbiology', 'Microbiology', '🦠'),
            ('genetics', 'Genetics', '🧬'),
            ('neuroscience', 'Neuroscience', '🧠'),
            ('astronomy', 'Astronomy', '🔭'),
            ('botany', 'Botany', '🌿'),
            ('zoology', 'Zoology', '🐘'),
            ('marine_biology', 'Marine Biology', '🐠'),
            ('forensic_science', 'Forensic Science', '🔍'),
            ('food_science', 'Food Science', '🍎'),
            ('pharmacology', 'Pharmacology', '💊'),
        ]
    },
    
    # 3. MEDICINE
    'MEDICINE': {
        'name': 'Faculty of Medicine',
        'icon': '🏥',
        'color': 'red',
        'departments': [
            ('general_medicine', 'General Medicine', '🩺'),
            ('surgery', 'Surgery', '🔪'),
            ('pediatrics', 'Pediatrics', '👶'),
            ('cardiology', 'Cardiology', '❤️'),
            ('neurology', 'Neurology', '🧠'),
            ('pharmacy', 'Pharmacy', '💊'),
            ('nursing', 'Nursing', '👩‍⚕️'),
            ('dentistry', 'Dentistry', '🦷'),
            ('psychiatry', 'Psychiatry', '🧠'),
            ('radiology', 'Radiology', '📷'),
            ('anesthesiology', 'Anesthesiology', '💉'),
            ('orthopedics', 'Orthopedics', '🦴'),
            ('dermatology', 'Dermatology', '🔬'),
            ('ophthalmology', 'Ophthalmology', '👁️'),
            ('obstetrics', 'Obstetrics & Gynecology', '👶'),
            ('urology', 'Urology', '🚽'),
            ('ent', 'Ear Nose Throat', '👂'),
            ('emergency', 'Emergency Medicine', '🚑'),
            ('family_medicine', 'Family Medicine', '🏠'),
            ('public_health', 'Public Health', '🌍'),
        ]
    },
    
    # 4. BUSINESS
    'BUSINESS': {
        'name': 'School of Business',
        'icon': '💼',
        'color': 'yellow',
        'departments': [
            ('accounting', 'Accounting', '💰'),
            ('finance', 'Finance', '📈'),
            ('marketing', 'Marketing', '📢'),
            ('management', 'Management', '📊'),
            ('economics', 'Economics', '📉'),
            ('entrepreneurship', 'Entrepreneurship', '🚀'),
            ('hr', 'Human Resources', '👥'),
            ('supply_chain', 'Supply Chain Management', '🚚'),
            ('business_analytics', 'Business Analytics', '📊'),
            ('international_business', 'International Business', '🌐'),
            ('operations', 'Operations Management', '⚙️'),
            ('real_estate', 'Real Estate', '🏠'),
            ('hospitality', 'Hospitality Management', '🏨'),
            ('sports_management', 'Sports Management', '⚽'),
            ('healthcare_admin', 'Healthcare Administration', '🏥'),
        ]
    },
    
    # 5. LAW
    'LAW': {
        'name': 'Faculty of Law',
        'icon': '⚖️',
        'color': 'purple',
        'departments': [
            ('constitutional', 'Constitutional Law', '📜'),
            ('criminal', 'Criminal Law', '🔒'),
            ('civil_law', 'Civil Law', '🏛️'),
            ('corporate', 'Corporate Law', '🏢'),
            ('international', 'International Law', '🌐'),
            ('human_rights', 'Human Rights Law', '🤝'),
            ('tax', 'Tax Law', '📑'),
            ('environmental_law', 'Environmental Law', '🌿'),
            ('family_law', 'Family Law', '👪'),
            ('labor_law', 'Labor Law', '👷'),
            ('intellectual_property', 'Intellectual Property Law', '©️'),
            ('cyber_law', 'Cyber Law', '💻'),
            ('maritime_law', 'Maritime Law', '🚢'),
            ('health_law', 'Health Law', '🏥'),
        ]
    },
    
    # 6. ARTS & HUMANITIES
    'ARTS_HUMANITIES': {
        'name': 'Faculty of Arts & Humanities',
        'icon': '🎨',
        'color': 'pink',
        'departments': [
            ('history', 'History', '📜'),
            ('literature', 'Literature', '📖'),
            ('philosophy', 'Philosophy', '🤔'),
            ('linguistics', 'Linguistics', '🗣️'),
            ('art_history', 'Art History', '🖼️'),
            ('music', 'Music', '🎵'),
            ('theater', 'Theater Arts', '🎭'),
            ('anthropology', 'Anthropology', '🗿'),
            ('archaeology', 'Archaeology', '🏺'),
            ('cultural_studies', 'Cultural Studies', '🌍'),
            ('film_studies', 'Film Studies', '🎬'),
            ('creative_writing', 'Creative Writing', '✍️'),
            ('journalism', 'Journalism', '📰'),
            ('digital_media', 'Digital Media', '📱'),
            ('gender_studies', 'Gender Studies', '⚧️'),
        ]
    },
    
    # 7. SOCIAL SCIENCES
    'SOCIAL_SCIENCES': {
        'name': 'Faculty of Social Sciences',
        'icon': '🌍',
        'color': 'teal',
        'departments': [
            ('psychology', 'Psychology', '🧠'),
            ('sociology', 'Sociology', '👥'),
            ('political_science', 'Political Science', '🏛️'),
            ('geography', 'Geography', '🗺️'),
            ('social_work', 'Social Work', '🤝'),
            ('communication', 'Communication', '📺'),
            ('international_relations', 'International Relations', '🌐'),
            ('economics_social', 'Economics', '📉'),
            ('public_policy', 'Public Policy', '📋'),
            ('urban_studies', 'Urban Studies', '🏙️'),
            ('demography', 'Demography', '👥'),
            ('criminology', 'Criminology', '🚔'),
            ('development_studies', 'Development Studies', '🌱'),
            ('peace_studies', 'Peace Studies', '🕊️'),
        ]
    },
    
    # 8. EDUCATION
    'EDUCATION': {
        'name': 'College of Education',
        'icon': '📚',
        'color': 'orange',
        'departments': [
            ('elementary', 'Elementary Education', '📘'),
            ('secondary', 'Secondary Education', '📗'),
            ('special_ed', 'Special Education', '🤗'),
            ('educational_leadership', 'Educational Leadership', '🎓'),
            ('curriculum', 'Curriculum & Instruction', '📋'),
            ('ed_psychology', 'Educational Psychology', '🧠'),
            ('tesol', 'TESOL', '🌏'),
            ('early_childhood', 'Early Childhood Education', '🧸'),
            ('higher_education', 'Higher Education', '🏛️'),
            ('adult_education', 'Adult Education', '👨‍🎓'),
            ('educational_technology', 'Educational Technology', '💻'),
            ('counseling', 'Counseling', '🤝'),
            ('physical_education', 'Physical Education', '🏃'),
            ('math_education', 'Mathematics Education', '📐'),
            ('science_education', 'Science Education', '🔬'),
        ]
    },
    
    # 9. AGRICULTURE
    'AGRICULTURE': {
        'name': 'Faculty of Agriculture',
        'icon': '🌾',
        'color': 'lime',
        'departments': [
            ('agronomy', 'Agronomy', '🌽'),
            ('animal_science', 'Animal Science', '🐄'),
            ('horticulture', 'Horticulture', '🌺'),
            ('food_science', 'Food Science', '🍎'),
            ('agricultural_economics', 'Agricultural Economics', '💰'),
            ('plant_pathology', 'Plant Pathology', '🌿'),
            ('soil_science', 'Soil Science', '🪨'),
            ('veterinary', 'Veterinary Medicine', '🐕'),
            ('forestry', 'Forestry', '🌲'),
            ('fisheries', 'Fisheries', '🐟'),
            ('entomology', 'Entomology', '🦋'),
            ('agribusiness', 'Agribusiness', '🏪'),
            ('sustainable_ag', 'Sustainable Agriculture', '♻️'),
            ('organic_farming', 'Organic Farming', '🌱'),
        ]
    },
    
    # 10. ARCHITECTURE
    'ARCHITECTURE': {
        'name': 'School of Architecture',
        'icon': '🏛️',
        'color': 'cyan',
        'departments': [
            ('architecture', 'Architecture', '🏗️'),
            ('urban_planning', 'Urban Planning', '🏙️'),
            ('landscape', 'Landscape Architecture', '🌳'),
            ('interior_design', 'Interior Design', '🛋️'),
            ('construction', 'Construction Management', '🔨'),
            ('sustainable_design', 'Sustainable Design', '♻️'),
            ('industrial_design', 'Industrial Design', '🏭'),
            ('graphic_design', 'Graphic Design', '🎨'),
            ('fashion_design', 'Fashion Design', '👗'),
        ]
    },
    
    # 11. INFORMATION TECHNOLOGY
    'INFORMATION_TECHNOLOGY': {
        'name': 'School of Information Technology',
        'icon': '💻',
        'color': 'indigo',
        'departments': [
            ('cs', 'Computer Science', '💻'),
            ('information_systems', 'Information Systems', '📊'),
            ('cybersecurity', 'Cybersecurity', '🔒'),
            ('data_science', 'Data Science', '📈'),
            ('software_eng', 'Software Engineering', '⚙️'),
            ('networking', 'Networking', '🌐'),
            ('ai_ml', 'AI & Machine Learning', '🤖'),
            ('cloud_computing', 'Cloud Computing', '☁️'),
            ('web_development', 'Web Development', '🌐'),
            ('mobile_dev', 'Mobile Development', '📱'),
            ('game_dev', 'Game Development', '🎮'),
            ('database', 'Database Systems', '🗄️'),
            ('it_management', 'IT Management', '💼'),
        ]
    },
    
    # 12. RELIGION STUDIES
    'RELIGION_STUDIES': {
        'name': 'Faculty of Religion Studies',
        'icon': '🕊️',
        'color': 'purple',
        'departments': [
            ('islamic', 'Islamic Studies', '🕌'),
            ('christian', 'Christian Studies', '⛪'),
            ('judaism', 'Jewish Studies', '✡️'),
            ('hinduism', 'Hindu Studies', '🕉️'),
            ('buddhism', 'Buddhist Studies', '☸️'),
            ('comparative', 'Comparative Religion', '🌍'),
            ('philosophy_religion', 'Philosophy of Religion', '🤔'),
            ('theology', 'Theology', '📖'),
            ('religious_history', 'Religious History', '📜'),
            ('eastern_religions', 'Eastern Religions', '🪷'),
            ('indigenous', 'Indigenous Religions', '🏔️'),
            ('ethics', 'Religious Ethics', '⚖️'),
        ]
    },
    
    # 13. HIGH SCHOOL
    'HIGH_SCHOOL': {
        'name': 'High School Section',
        'icon': '📘',
        'color': 'teal',
        'departments': [
            ('mathematics_hs', 'Mathematics', '📐'),
            ('physics_hs', 'Physics', '⚛️'),
            ('chemistry_hs', 'Chemistry', '🧪'),
            ('biology_hs', 'Biology', '🧬'),
            ('english_hs', 'English', '📖'),
            ('history_hs', 'History', '🏛️'),
            ('geography_hs', 'Geography', '🗺️'),
            ('economics_hs', 'Economics', '📊'),
            ('computer_hs', 'Computer Science', '💻'),
            ('art_hs', 'Art', '🎨'),
            ('music_hs', 'Music', '🎵'),
            ('physical_ed_hs', 'Physical Education', '🏃'),
            ('foreign_lang_hs', 'Foreign Languages', '🌐'),
            ('civics_hs', 'Civics', '🏛️'),
        ]
    },
    
    # 14. PSYCHOLOGY
    'PSYCHOLOGY': {
        'name': 'Department of Psychology',
        'icon': '🧠',
        'color': 'teal',
        'departments': [
            ('clinical_psych', 'Clinical Psychology', '🩺'),
            ('cognitive_psych', 'Cognitive Psychology', '🧠'),
            ('developmental_psych', 'Developmental Psychology', '👶'),
            ('social_psych', 'Social Psychology', '👥'),
            ('industrial_psych', 'Industrial Psychology', '💼'),
            ('educational_psych', 'Educational Psychology', '📚'),
            ('neuropsychology', 'Neuropsychology', '⚡'),
            ('forensic_psych', 'Forensic Psychology', '🔍'),
            ('health_psych', 'Health Psychology', '🏥'),
            ('sports_psych', 'Sports Psychology', '⚽'),
        ]
    },
    
    # 15. ENVIRONMENTAL STUDIES
    'ENVIRONMENTAL': {
        'name': 'School of Environmental Studies',
        'icon': '🌍',
        'color': 'green',
        'departments': [
            ('environmental_science', 'Environmental Science', '🔬'),
            ('climate_change', 'Climate Change Studies', '🌡️'),
            ('conservation', 'Conservation Biology', '🦋'),
            ('renewable_energy', 'Renewable Energy', '☀️'),
            ('waste_management', 'Waste Management', '♻️'),
            ('water_resources', 'Water Resources', '💧'),
            ('sustainability', 'Sustainability Studies', '🌱'),
            ('environmental_policy', 'Environmental Policy', '📜'),
        ]
    },
}

def init():
    print("=" * 70)
    print("🏫 INITIALIZING ALL FACULTIES AND DEPARTMENTS")
    print("=" * 70)
    
    faculty_count = 0
    dept_count = 0
    
    for code, data in FACULTIES_DATA.items():
        faculty, created = Faculty.objects.get_or_create(
            code=code,
            defaults={
                'name': data['name'],
                'icon': data['icon'],
                'color': data['color'],
                'is_active': True
            }
        )
        if created:
            faculty_count += 1
            print(f"\n✅ Created Faculty: {faculty.name} ({faculty.code})")
        
        for dept_code, dept_name, icon in data['departments']:
            dept, created = Department.objects.get_or_create(
                faculty=faculty,
                code=dept_code,
                defaults={
                    'name': dept_name,
                    'icon': icon,
                    'search_subjects': '',
                    'is_active': True
                }
            )
            if created:
                dept_count += 1
                print(f"   ✅ Created: {dept_name}")
    
    print("\n" + "=" * 70)
    print(f"✨ INITIALIZATION COMPLETE!")
    print(f"   📚 Faculties Created: {faculty_count}")
    print(f"   📖 Departments Created: {dept_count}")
    print(f"   🏫 Total Faculties: {Faculty.objects.count()}")
    print(f"   📚 Total Departments: {Department.objects.count()}")
    print("=" * 70)
    
    print("\n📋 NEXT STEPS:")
    print("   1. Run: python update_department_subjects.py")
    print("   2. Run: python manage.py smart_populate")

if __name__ == "__main__":
    init()