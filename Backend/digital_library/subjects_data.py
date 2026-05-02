# digital_library/subjects_data.py

DEPARTMENT_SUBJECTS = {
    # Engineering
    'mechanical': 'Mechanical Engineering,Thermodynamics,Fluid Mechanics,Heat Transfer,Robotics,Manufacturing,Dynamics,Vibrations',
    'electrical': 'Electrical Engineering,Electronics,Power Systems,Circuit Analysis,Control Systems,Signal Processing,Telecommunications',
    'civil': 'Civil Engineering,Structural Engineering,Construction,Geotechnical Engineering,Transportation,Concrete Technology',
    'computer': 'Computer Engineering,Computer Architecture,Embedded Systems,Digital Logic,Hardware Design,Microprocessors',
    'chemical': 'Chemical Engineering,Process Engineering,Thermodynamics,Reaction Engineering,Separation Processes,Chemical Kinetics',
    'biomedical': 'Biomedical Engineering,Medical Devices,Biomaterials,Tissue Engineering,Bioinstrumentation,Biomechanics',
    'aerospace': 'Aerospace Engineering,Aerodynamics,Propulsion,Flight Mechanics,Spacecraft Design,Orbital Mechanics',
    'industrial': 'Industrial Engineering,Operations Research,Supply Chain,Quality Control,Ergonomics,Production Planning',
    
    # Science
    'physics': 'Physics,Quantum Mechanics,Astrophysics,Nuclear Physics,Optics,Thermodynamics,Electromagnetism,Relativity',
    'chemistry': 'Chemistry,Organic Chemistry,Inorganic Chemistry,Biochemistry,Analytical Chemistry,Physical Chemistry',
    'biology': 'Biology,Molecular Biology,Genetics,Ecology,Cell Biology,Evolution,Microbiology,Zoology,Botany',
    'mathematics': 'Mathematics,Calculus,Algebra,Geometry,Statistics,Number Theory,Differential Equations,Topology',
    'computer_science': 'Computer Science,Programming,Algorithms,Data Structures,Software Development,Database,Operating Systems',
    'statistics': 'Statistics,Data Analysis,Probability,Regression,Biostatistics,Statistical Modeling,Data Science',
    'geology': 'Geology,Mineralogy,Petrology,Stratigraphy,Paleontology,Geochemistry,Geophysics',
    'environmental': 'Environmental Science,Ecology,Climate Change,Conservation,Pollution Control,Sustainability,Earth Science',
    
    # Medicine
    'general_medicine': 'Medicine,Clinical Medicine,Internal Medicine,Diagnosis,Treatment,Medical Practice,Pathology',
    'surgery': 'Surgery,Surgical Techniques,Operative Surgery,Minimally Invasive Surgery,Surgical Oncology,Trauma Surgery',
    'pediatrics': 'Pediatrics,Child Health,Neonatology,Pediatric Diseases,Child Development,Adolescent Medicine',
    'cardiology': 'Cardiology,Heart Diseases,Cardiovascular Medicine,ECG,Cardiac Surgery,Hypertension',
    'neurology': 'Neurology,Brain Disorders,Neuroscience,Stroke,Neurodegenerative Diseases,Neuroanatomy',
    'pharmacy': 'Pharmacy,Pharmacology,Clinical Pharmacy,Drug Development,Pharmaceutical Chemistry,Toxicology',
    'nursing': 'Nursing,Patient Care,Clinical Nursing,Nursing Practice,Healthcare Management,Nursing Education',
    'dentistry': 'Dentistry,Oral Health,Dental Surgery,Orthodontics,Periodontics,Endodontics,Prosthodontics',
    
    # Business
    'accounting': 'Accounting,Financial Accounting,Managerial Accounting,Auditing,Taxation,Cost Accounting',
    'finance': 'Finance,Corporate Finance,Investment,Financial Management,Banking,Portfolio Management,Risk Management',
    'marketing': 'Marketing,Digital Marketing,Consumer Behavior,Brand Management,Market Research,Advertising',
    'management': 'Management,Business Management,Organizational Behavior,Leadership,Strategic Management,Human Resources',
    'economics': 'Economics,Microeconomics,Macroeconomics,Econometrics,Development Economics,International Economics',
    'entrepreneurship': 'Entrepreneurship,Startup,Business Planning,Innovation,Venture Capital,Small Business',
    'hr': 'Human Resources,HR Management,Talent Management,Recruitment,Organizational Development,Employee Relations',
    'supply_chain': 'Supply Chain,Logistics,Operations Management,Inventory,Procurement,Transportation',
    
    # Law
    'constitutional': 'Constitutional Law,Constitution,Public Law,Fundamental Rights,Administrative Law,Human Rights',
    'criminal': 'Criminal Law,Criminal Justice,Penal Law,Criminal Procedure,Forensic Law,Criminology',
    'civil_law': 'Civil Law,Tort Law,Contract Law,Property Law,Family Law,Succession Law',
    'corporate': 'Corporate Law,Business Law,Company Law,Securities Law,Mergers and Acquisitions,Corporate Governance',
    'international': 'International Law,Public International Law,Treaties,International Relations,Diplomatic Law,UN Law',
    'human_rights': 'Human Rights,International Human Rights Law,Civil Rights,Social Justice,Refugee Law',
    'tax': 'Tax Law,Taxation,Income Tax,Corporate Tax,International Tax,Tax Planning',
    'environmental_law': 'Environmental Law,Climate Change Law,Natural Resources Law,Energy Law,Water Law',
    
    # Arts & Humanities
    'history': 'History,World History,Ancient History,Modern History,European History,American History,Medieval History',
    'literature': 'Literature,English Literature,Comparative Literature,Poetry,Novels,Literary Criticism,World Literature',
    'philosophy': 'Philosophy,Ethics,Metaphysics,Epistemology,Logic,Political Philosophy,Ancient Philosophy',
    'linguistics': 'Linguistics,Language,Phonetics,Syntax,Semantics,Sociolinguistics,Psycholinguistics',
    'art_history': 'Art History,Visual Arts,Renaissance Art,Modern Art,Contemporary Art,Art Criticism',
    'music': 'Music,Music Theory,Music History,Composition,Performance,Music Education,Ethnomusicology',
    'theater': 'Theater,Drama,Performance Studies,Acting,Directing,Playwriting,Theater History',
    'anthropology': 'Anthropology,Cultural Anthropology,Social Anthropology,Archaeology,Ethnography,Physical Anthropology',
    
    # Social Sciences
    'psychology': 'Psychology,Clinical Psychology,Cognitive Psychology,Developmental Psychology,Social Psychology,Abnormal Psychology',
    'sociology': 'Sociology,Social Theory,Social Research,Urban Sociology,Rural Sociology,Gender Studies',
    'political_science': 'Political Science,Political Theory,Comparative Politics,International Relations,Public Policy,Governance',
    'geography': 'Geography,Physical Geography,Human Geography,GIS,Cartography,Geospatial Analysis',
    'social_work': 'Social Work,Social Welfare,Community Development,Counseling,Social Policy,Case Management',
    'communication': 'Communication,Mass Communication,Media Studies,Journalism,Public Relations,Interpersonal Communication',
    'journalism': 'Journalism,News Writing,Broadcast Journalism,Digital Media,Investigative Journalism,Photojournalism',
    'international_relations': 'International Relations,Global Politics,Diplomacy,Foreign Policy,Security Studies,Peace Studies',
    
    # Education
    'elementary': 'Elementary Education,Primary Education,Teaching Methods,Early Childhood,Curriculum Development,Literacy',
    'secondary': 'Secondary Education,High School Teaching,Curriculum Development,Subject Pedagogy,Adolescent Education',
    'special_ed': 'Special Education,Inclusive Education,Learning Disabilities,Educational Psychology,Behavioral Disorders',
    'educational_leadership': 'Educational Leadership,School Administration,Educational Management,Supervision,Education Policy',
    'curriculum': 'Curriculum,Instructional Design,Educational Technology,Assessment,Learning Theories,Curriculum Development',
    'ed_psychology': 'Educational Psychology,Learning Theories,Child Development,Motivation,Cognitive Development,Assessment',
    'tesol': 'TESOL,ESL,Language Teaching,Applied Linguistics,Bilingual Education,Second Language Acquisition',
    'early_childhood': 'Early Childhood Education,Preschool,Child Development,Kindergarten,Play-Based Learning,Child Psychology',
    
    # Agriculture
    'agronomy': 'Agronomy,Crop Science,Soil Management,Sustainable Agriculture,Plant Breeding,Irrigation',
    'animal_science': 'Animal Science,Livestock,Animal Nutrition,Animal Breeding,Veterinary Science,Animal Welfare',
    'horticulture': 'Horticulture,Plant Science,Gardening,Floriculture,Pomology,Olericulture,Landscaping',
    'food_science': 'Food Science,Food Technology,Food Safety,Nutrition,Food Processing,Food Engineering',
    'agricultural_economics': 'Agricultural Economics,Farm Management,Agribusiness,Rural Development,Agricultural Policy',
    'plant_pathology': 'Plant Pathology,Plant Diseases,Phytopathology,Plant Protection,Fungal Diseases',
    'soil_science': 'Soil Science,Soil Chemistry,Soil Physics,Pedology,Fertilizers,Soil Conservation',
    'veterinary': 'Veterinary Medicine,Animal Health,Veterinary Surgery,Animal Diseases,Zoonotic Diseases',
    
    # Architecture
    'architecture': 'Architecture,Architectural Design,Building Design,Architectural Theory,Urban Design,History of Architecture',
    'urban_planning': 'Urban Planning,City Planning,Regional Planning,Urban Design,Land Use Planning,Transportation Planning',
    'landscape': 'Landscape Architecture,Landscape Design,Garden Design,Environmental Design,Urban Landscape',
    'interior_design': 'Interior Design,Interior Architecture,Space Planning,Residential Design,Commercial Design,Furniture Design',
    'construction': 'Construction Management,Project Management,Building Construction,Cost Estimation,Construction Safety',
    'sustainable_design': 'Sustainable Design,Green Building,Eco-Architecture,Passive Design,Energy Efficiency',
    
    # Information Technology
    'cs': 'Computer Science,Programming,Algorithms,Data Structures,Software Engineering,Operating Systems,Computer Networks',
    'information_systems': 'Information Systems,Database,System Analysis,IT Management,Business Intelligence,Data Management',
    'cybersecurity': 'Cybersecurity,Information Security,Network Security,Cryptography,Ethical Hacking,Cyber Defense',
    'data_science': 'Data Science,Big Data,Data Analytics,Machine Learning,Data Mining,Python,R,Statistics',
    'software_eng': 'Software Engineering,Software Development,Agile,DevOps,Software Testing,Software Architecture',
    'networking': 'Networking,Computer Networks,TCP/IP,Network Security,Wireless Networks,Network Administration',
    'ai_ml': 'Artificial Intelligence,Machine Learning,Deep Learning,Neural Networks,Computer Vision,NLP,Robotics',
    'cloud_computing': 'Cloud Computing,AWS,Azure,Distributed Systems,Cloud Architecture,DevOps,Containerization',
    
    # Religion Studies
    'islamic': 'Islam,Quran,Hadith,Islamic Law,Sharia,Islamic History,Islamic Philosophy,Sufism',
    'christian': 'Christianity,Bible,Theology,Church History,New Testament,Old Testament,Gospels,Christian Ethics',
    'judaism': 'Judaism,Torah,Jewish History,Talmud,Hebrew Bible,Zionism,Jewish Philosophy',
    'hinduism': 'Hinduism,Vedas,Bhagavad Gita,Indian Philosophy,Upanishads,Yoga,Hindu Mythology',
    'buddhism': 'Buddhism,Dharma,Meditation,Buddhist Philosophy,Nirvana,Theravada,Mahayana,Vajrayana',
    'comparative': 'Comparative Religion,World Religions,Interfaith,Religious Studies,Theology,Religious History',
    'philosophy_religion': 'Philosophy of Religion,Theology,Religious Philosophy,Ethics,Spirituality,Mysticism',
    
    # High School
    'mathematics_hs': 'Algebra,Geometry,Calculus,Trigonometry,Statistics,Pre-Calculus,Math,Arithmetic',
    'physics_hs': 'Physics,Mechanics,Electricity,Magnetism,Waves,Optics,Thermodynamics,Kinematics',
    'chemistry_hs': 'Chemistry,Organic Chemistry,Inorganic Chemistry,Periodic Table,Chemical Reactions,Stoichiometry',
    'biology_hs': 'Biology,Cell Biology,Genetics,Human Anatomy,Ecology,Evolution,Microbiology,Zoology',
    'english_hs': 'English Literature,Grammar,Writing,Poetry,Shakespeare,Essay Writing,Composition,Vocabulary',
    'history_hs': 'World History,American History,European History,Ancient Civilizations,Modern History,Geography',
    'geography_hs': 'Geography,Map Reading,Physical Geography,Human Geography,World Maps,Environmental Geography',
    'economics_hs': 'Economics,Microeconomics,Macroeconomics,Personal Finance,Business,Financial Literacy'
}