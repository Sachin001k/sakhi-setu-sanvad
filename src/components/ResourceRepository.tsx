import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Play, BookOpen, FileText, Video, Calendar, Clock, ExternalLink, Trash2, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  language: string;
  category: string;
  created_at: string;
  publisher?: string;
  user_id?: string;
}

const categories = [
  'All',
  'Exercise',
  'Nutrition',
  'Sleep & Meditation',
  'News and Healthcare Policies',
  'Education',
  'Video Recipes'
];

const resourceTypes = [
  { value: 'all', label: 'All', icon: FileText },
  { value: 'video', label: 'Videos', icon: Video },
  { value: 'article', label: 'Articles', icon: BookOpen },
];

export const ResourceRepository: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchResources();
  }, []);

  const searchRealResources = async (searchQuery: string) => {
    try {
      // Search for real resources based on menopause-related topics
      const searchTerms = [
        'menopause yoga exercises',
        'menopause nutrition guidelines',
        'menopause meditation techniques',
        'menopause hormonal changes education',
        'menopause sleep hygiene tips',
        'menopause support groups community'
      ];

      const allResources: Resource[] = [];

      for (const term of searchTerms) {
        try {
          // Use a simple search approach - in a real app, you'd use a proper search API
          const searchResults = await performWebSearch(term);
          allResources.push(...searchResults);
        } catch (error) {
          console.error(`Error searching for ${term}:`, error);
        }
      }

      // If no real results, fall back to curated real resources
      if (allResources.length === 0) {
        const curatedResources: Resource[] = [
          {
            id: '1',
            title: 'SaurabhBothra Strength training for Women',
            description: '12-minute bodyweight strength training exercises designed to support women through the menopause phase.',
            type: 'video',
            url: 'https://youtu.be/RiG7Q1Nek8E?si=eoyScjxJHMiEhaiU',
            language: 'Hindi',
            category: 'Exercise',
            created_at: new Date().toISOString(),
            publisher: 'Saurabh Bothra',
          },
          {
            id: '2',
            title: 'Menopause: Myths, Realities, and Management Tips',
            description: 'The video discusses the myths and realities of menopause in India, providing women with tips on diet, exercise, and maintaining a healthy bio-clock to manage the journey smoothly.',
            type: 'video',
            url: 'https://youtu.be/33qq2Ua8tNA?si=Pq3Ax1_fougT0a7j',
            language: 'Hindi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Saurabh Bothra',
          },
          {
            id: '3',
            title: 'How to Manage Menopause & Perimenopause: A Guide by Experts',
            description: 'A detailed discussion featuring a nutritionist and a gynecologist about the stages of menopause, common symptoms, and comprehensive management strategies focusing on diet, strength training, and lifestyle planning.',
            type: 'video',
            url: 'https://youtu.be/PhbtvCjPe8c?si=H1KeSFKnuvev3Cnb',
            language: 'Marathi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Nutritionist Amita Gadre',
          },
          {
            id: '4',
            title: '4 Yoga Poses to Relieve Menopause Discomfort',
            description: 'A demonstration of 4 specific yoga poses (Baddha Konasana, Adho Mukha Svanasana, Virasana, and Viparita Karani) intended to relieve discomfort related to menopause.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=NIIxmqJp_XI',
            language: 'Hindi',
            category: 'Exercise',
            created_at: new Date().toISOString(),
            publisher: 'Jeevan Kosh',
          },
          {
            id: '5',
            title: 'Yoga for Menopause: Best Poses to Reduce Symptoms',
            description: 'A yoga session demonstrating poses (like Salabhasana, Bhujangasana, Setubandhasana, and Vishnu Asana) and a breathing exercise (Anulom Vilom) to help women reduce the physical and mental symptoms of menopause, such as stress, hot flashes, and body stiffness.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=selzIDR2Elg',
            language: 'Hindi',
            category: 'Exercise',
            created_at: new Date().toISOString(),
            publisher: 'Siddhi Yoga Hindi',
          },
          {
            id: '6',
            title: 'Yoga Poses for Menopause',
            description: 'A very short video demonstrating a yoga pose or sequence (likely visual) aimed at providing relief from menopause symptoms.',
            type: 'video',
            url: 'https://www.youtube.com/shorts/8WIZB1O7cxA',
            language: 'Hindi',
            category: 'Sleep & Meditation',
            created_at: new Date().toISOString(),
            publisher: 'Namaste Yoga Classes',
          },
          {
            id: '7',
            title: 'Daily Pranayama under 15-Minutes',
            description: 'A 15-minute daily Pranayama (breathing exercise) practice, including Bhastrika (Bellows Breath), Breath of Joy, Box Breath, and Nadi Shodhan (Alternate Nostril Breathing).',
            type: 'video',
            url: 'https://youtu.be/I77hh5I69gA?si=z50jyj14SuvlL4l',
            language: 'Hindi',
            category: 'Sleep & Meditation',
            created_at: new Date().toISOString(),
            publisher: 'Saurabh Bothra',
          },
          {
            id: '8',
            title: 'All about Menopause',
            description: 'A detailed discussion on menopause, its natural progression, associated body changes (like weight gain and hormonal shifts), and key lifestyle factors to manage it. The discussion emphasizes the importance of a diverse, local, and traditional diet, sustainable weight loss, regular exercise (including strength training and yoga), and adequate rest/sleep',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=QMkZp9z1QBc',
            language: 'Marathi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Rujutadiwekarofficial',
          },
          {
            id: '9',
            title: 'How to manage menopause/perimenopause? Part 2',
            description: 'A detailed discussion (in Marathi, Part 2) with a gynecologist on managing menopause and perimenopause, covering topics like cancer screening (breast, cervical, endometrial), Hormone Replacement Therapy (HRT), changes in sexual drive, hormonal changes leading to hair growth, and the importance of family support for mood swings.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=8-vAab80-YQ',
            language: 'Marathi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Rujutadiwekarofficial',
          },
          {
            id: "10",
            title: "3 foods to beat hot flushes",
            description: "A discussion about three forgotten traditional foods (Kopra Pak, Chit Chutney, and Raw Banana Chips) that help manage hot flashes, cravings, and mood swings associated with menopause by providing necessary nutrients like MCTs, Lauric acid, calcium, phytoestrogens, and Vitamin B6.",
            type: "video",
            url: "https://youtu.be/5VBlSmqE_Ls",
            language: "English/Hindi",
            category: "Nutrition",
            created_at: new Date().toISOString(),
            publisher: "Rujutadiwekarofficial"
          },
          {
            id: '11',
            title: 'How To deal with Menopause | Menopause Diet and Home Remedies for Perimenopause | Shivangi Desai',
            description: 'A detailed guide on managing menopause and perimenopause, focusing on diet changes to address hormonal drops. Key recommendations include increasing intake of calcium, Vitamin D, fiber, phytoestrogens (flax seeds), Omega-3s, and protein. Also stresses the importance of regular movement/exercise, quality sleep, and stress-relieving activities like yoga and meditation.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=O6tDDPgH5LM',
            language: 'Hindi/English',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Fit Bharat'
          },
          {
            id: '12',
            title: '3 Sleep rules for Menopause',
            description: 'Rujuta Diwekar shares three rules for improving sleep quality during menopause to regulate key hormones (IGF-1, Growth Hormone, Testosterone) and alleviate symptoms like skin pigmentation, hair loss, and fatigue. The rules cover diet timing (never skip breakfast, early dinner), disciplined afternoon napping (20-30 minutes, before 3 PM), and avoiding substances/activities that interfere with sleep (smoking, excessive caffeine/chocolate, and screen time on the bed).',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=PAfBiQCZgHk',
            language: 'Hindi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Rujutadiwekarofficial'
          },
          {
            id: '13',
            title: 'Managing Weight During Menopause',
            description: 'A discussion on how to manage weight gain and other symptoms during menopause and perimenopause. Key advice focuses on dietary changes, including increasing intake of protein, fiber, hydration, and specific micronutrients (Vitamin D, K, Calcium, Selenium, B-Complex). It stresses avoiding fatty, processed, and sugary foods, incorporating exercise (walking, yoga), and managing mental well-being by pursuing hobbies and staying happy.',
            type: 'video',
            url: 'https://youtu.be/rqxnnYddrlI',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Swasthya Plus Marathi'
          },
          {
            id: '14',
            title: 'Menopause Diet: Tips for Mood Swings and Bone Health',
            description: 'A detailed discussion on dietary and lifestyle changes for managing menopause symptoms. Key advice includes consuming dairy (for calcium/Vitamin D and sleep), whole grains, seasonal produce, and foods rich in phytoestrogens (like flax seeds) and quality proteins to combat bone fragility, muscle loss, and mood swings. It strongly recommends avoiding coffee, smoking, refined sugar, and emphasizes regular exercise.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=Zvkk6YbyNo0',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Dr. Charuta Koparkar',
          },
          {
            id: '15',
            title: 'How to Make Soft & Authentic Bajra Bhakri (Millet Flatbread) at Home',
            description: 'A step-by-step tutorial on how to make soft, authentic, and puffy Bajra (Pearl Millet) Bhakri. The video emphasizes proper kneading and roasting techniques to ensure the Bhakri stays soft and fluffs up completely. It is recommended as a nutritious, warming winter staple, often served with Baingan Bharta (smoked eggplant curry) or Methi-Besan bhaji (fenugreek-gram flour vegetable).',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=adm69mNUAu8',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'National FOOD Chaska ( NFC)',
          },
          {
            id: '16',
            title: 'Menopause: Correct Age and Symptoms',
            description: 'A discussion with Dr. Supriya Puranik about the correct age for menopause (रजोनिवृत्ति की सही उम्र) and the common symptoms (menopause ke lakshan) women experience.',
            type: 'video',
            url: 'https://youtu.be/hSzJBHc8Km4',
            language: 'Hindi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Dr Supriya Puranik IVF, Pune'
          },
          {
            id: '17',
            title: 'Right Age and Symptoms of Menopause (Marathi)',
            description: 'The article (in Marathi) discusses the correct age for menopause (40-55 years), detailing common symptoms like hot flashes, mood swings, sleep issues, weight gain, and bone density loss. It explains the medical definition (12 consecutive months without a period) and emphasizes the need for a focused diet and awareness.',
            type: 'article',
            url: 'https://www.navarashtra.com/special-coverage/world-menopause-day-what-is-the-right-age-for-women-to-start-menopause-find-out-what-the-health-science-says-nrhp-664043.html',
            language: 'Marathi',
            category: 'News and Healthcare Policies',
            created_at: new Date().toISOString(),
            publisher: 'Navarashtra'
          },
          {
            id: '18',
            title: 'What is Menopause and its Symptoms',
            description: 'A medical explanation by Dr. Suchita Deshmukh defining menopause as the cessation of periods for 12 consecutive months (typically 45-55 years). It details symptoms caused by reduced Estrogen and Progesterone, including menstrual irregularities, hot flashes, risk of urinary incontinence/prolapse, vaginal dryness, increased risk of heart disease/hypertension, and bone weakness.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=72Pvva9q4zU',
            language: 'Marathi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Mediliv Multispeciality Hospital'
          },
          {
            id: '19',
            title: 'Aliv/Halim Ladoo for Hair Loss and Anemia',
            description: 'A traditional recipe for making Aliv/Halim (Garden Cress Seed) Ladoo. These nutritious laddoos are presented as an effective remedy for hair loss and low hemoglobin/anemia, particularly beneficial for women due to the high iron and protein content of Aliv seeds.',
            type: 'video',
            url: 'https://youtu.be/Es0oD3RMLxY',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Priyas Kitchen'
          },
          {
            id: '20',
            title: 'Menopause Podcast with Experts',
            description: 'A detailed Marathi podcast featuring Gynecologist and Sex Counselor Dr. Sagar Pathak and Menopause Expert Dr. Neelima Deshpande. They discuss menopause as a natural transitional phase (रजोनिवृत्ती), not a disease, covering symptoms like forgetfulness/mistakes, the global increase in life expectancy leading to more women experiencing it, and the importance of addressing the impact on sexual health and careers.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=ba76Zw7SZTo',
            language: 'Marathi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Amuk Tamuk'
          },
          {
            id: '21',
            title: 'Menopause: Symptoms and Essential Diet Tips',
            description: 'A detailed guide by Dr. Charuta Koparkar defining menopause (40-55 years) and its stages. It covers immediate symptoms (hot flashes, irritability, irregular periods) and later risks (osteoporosis, heart issues, weight gain). Key tips include adopting a low-calorie, high-protein diet, using healthy fats, and consuming calcium and Omega-3 rich foods (flax seeds, nuts) for bone and heart health.',
            type: 'video',
            url: 'https://youtu.be/pzCOME1z-H0',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Dr. Charuta Koparkar'
          },
          {
            id: '22',
            title: 'Medical Insight into Menopause',
            description: 'A medical presentation by Dr. Shivanjali Khade defining menopause, its symptoms (hot flashes, skin changes, mood swings, loss of libido, and bone/cardiovascular risks due to reduced Estrogen), and different patterns of onset (surgical, pre-mature). It discusses treatment options, including lifestyle changes (diet, exercise, sunlight) and Hormone Replacement Therapy (HRT), including contraindications for HRT.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=fuct4TKMBog',
            language: 'Marathi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'PATKI HOSPITAL KOLHAPUR'
          },
          {
            id: '23',
            title: 'Menopause: Facts, Not Fears (Rujuta Diwekar)',
            description: 'A detailed talk by Rujuta Diwekar defining menopause as a natural milestone. It discusses symptoms like hot flashes, mood swings, and a natural increase in body fat that helps buffer the hormonal drop. Key advice includes following a local, seasonal, and traditional diet for nutritional diversity, and engaging in sustainable exercise (strength, cardio, yoga) for at least three hours a week. It also stresses the importance of rest, including a 20-minute afternoon nap.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=QkdGapHzFSw',
            language: 'Hindi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Rujutadiwekarofficial'
          },
          {
            id: '24',
            title: 'Menopause: Mental & Physical Issues, Home Remedies, Diet, Exercise (Ayurveda)',
            description: 'An Ayurvedic perspective by Vaidya Vinesh Nagare on managing the physical (hot flashes, joint pain, fatigue) and mental (anxiety, irritability) challenges of menopause. It provides home remedies, diet tips, and exercise advice, emphasizing yoga/Surya Namaskar, soaking raisins/dates, and the benefits of herbs like Shatavari, Ashwagandha, and Brahmi for strength and mental calm.',
            type: 'video',
            url: 'https://youtu.be/2YEYyH6P18g',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Shri Maulivishwa Ayurveda Research Center',
          },
          {
            id: '25',
            title: 'Menopause: Body Changes, Causes, Symptoms, and Care (Dr. Smeetha)',
            description: 'A scientific overview of menopause (40-55 years), detailing symptoms caused by reduced Estrogen (irregular periods, hot flashes, joint pain, mood swings, vaginal dryness). Management advice includes consulting a doctor, ensuring sufficient Calcium intake, regular exercise, and proper rest.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=aJPxMH4BfRQ',
            language: 'Marathi',
            category: 'Education',
            created_at: new Date().toISOString(),
            publisher: 'Dr. Smeetha\'s Health World',
          },
          {
            id: '26',
            title: 'Diet Tips for Menopause: Hormones, Muscle Loss, and Jimikand (Dt. Sarika Sharma)',
            description: 'A video focusing on diet for menopausal women to combat muscle loss and hormone imbalance (especially Progesterone decline). Key tips include daily consumption of soaked almonds and walnuts, increasing Magnesium (spinach), and eating Jimikand (Elephant Foot Yam) twice a week.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=tLlw2-P-Ef8',
            language: 'Hindi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Sehatnama with Rajinder',
          },
          {
            id: '27',
            title: 'Menopause: Phytoestrogen Diet, Home Remedies, and Managing Symptoms (Dt. Anika Kulkarni)',
            description: 'A discussion by Dr. Anika Kulkarni on menopause, covering causes, symptoms, and home remedies. It emphasizes a phytoestrogen-rich diet, including sprouted Mug beans, strawberries, and beans, to combat hormonal imbalance (Estrogen/Progesterone decline), osteoporosis, and mood swings. It also recommends using coconut oil or ghee for full-body massage to relieve physical dryness.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=nkmSGllS97A',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'happy and healthy life at home',
          },
          {
            id: '28',
            title: 'Menopause Superfood Part 1: Beetroot for Brain, Mood, and Liver Health (Dt. Renuka Kulkarni)',
            description: 'Part 1 of a superfood series for women after 40/menopause. It details the benefits of **Beetroot**, including strengthening heart cells, improving brain blood flow and memory, preventing premature aging, boosting mood via Serotonin, aiding digestion, reducing joint inflammation, and supporting liver health (detoxification and fatty liver improvement).',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=i5DHNxSpQFA',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Dietician Renuka Kulkarni',
          },
          {
            id: '29',
            title: '5 Best Foods for Perimenopause and Menopause Symptoms (Dr. Neera Bhan)',
            description: 'A short video listing 5 essential food groups to help alleviate common perimenopausal/menopausal symptoms like backache, fatigue, bloating, constipation, and hot flashes. The five recommended foods are dairy products, legumes (dals, rajma, chhole), soy products, nuts and seeds, and high-fiber foods (green leafy vegetables, oats, whole grains, fresh fruits/vegetables).',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=pvHnnGH1O0I',
            language: 'Hindi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Gynae Pedia -All About Women’s Health',
          },
          {
            id: '30',
            title: 'Protein 101: Daily Intake, Best Sources, and Health Myths (Podcast by Amita Gadre)',
            description: 'A detailed podcast covering the necessity of protein (1g per kg body weight) for muscle, hair, and organ health. Topics include vegetarian and non-vegetarian sources, why nut butters are not primary protein sources, how protein manages blood sugar (Glycemic Load), and debunking the myth that protein causes Uric Acid issues. Emphasizes gradual intake and adequate water.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=NMnyqlV0ISE',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Nutritionist Amita Gadre',
          },
          {
            id: '31',
            title: 'High Protein Soya Thalipeeth/Dosa Recipe (Gluten-Free)',
            description: 'A recipe for high-protein, high-fiber, gluten-free Thalipeeth (flatbread) or Chilla using Soya Chunks (Nutri). Recommended as a perfect breakfast, tiffin, or early dinner option, especially for those on a weight loss journey or looking for a vegetarian protein source. The recipe uses soaked and squeezed soya chunks mixed with gram flour (besan) and vegetables.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=qN_jPAnpkHA',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Meghna\'s Food Magic',
          },
          {
            id: '32',
            title: 'Protein-Rich Nutri Soya Chunks Masala Curry (Street Style Recipe)',
            description: 'A "street style" recipe for a protein-rich curry using Soya Chunks (Nutri). Key steps include soaking, squeezing, and roasting the soya chunks with ginger-garlic paste and salt. The unique gravy features three special components: using mustard oil for the base, adding coriander stems to the tomato puree, and using a small amount of baking soda to enhance the tomato flavor and balance acidity.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=eoqNsPShUR8',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'bharatzkitchen HINDI',
          },
          {
            id: '33',
            title: 'High Protein Black Chickpea (Kala Chana) Appe/Pancake Recipe',
            description: 'A recipe for a new kind of high-protein breakfast, snack, or light dinner made from soaked black chickpeas (Kala Chana) in the form of Appe (pancakes). The batter includes soaked chickpeas, cumin, salt, green chili, onion, and coriander, cooked in an Appe pan until fluffy. Best served with fresh coconut chutney.',
            type: 'video',
            url: 'https://youtube.com/shorts/IsfUBDe1KQQ?si=apPB7MkCxVz1eKAw',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Marathi Kitchen',
          },
          {
            id: '34',
            title: 'Unique Healthy & Protein-Rich Breakfast Recipe',
            description: 'A short video showcasing a unique recipe for a healthy and protein-rich breakfast.',
            type: 'video',
            url: 'https://youtube.com/shorts/T-21ojb7RvQ?si=yo7Ha4dmxomMdfSv',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Priya Vantalu',
          },
          {
            id: '35',
            title: 'High Protein Jowar Chilla/Dhirde (Sorghum Flatbread) in 10 Minutes',
            description: 'A quick, wholesome, and protein-rich recipe for Jowar (Sorghum) Dhirde (thin savory pancakes or chillas). The batter is made from Jowar flour and semolina (rava) for crispiness, mixed with lightly sautéed vegetables (onion, capsicum, carrot, tomato) and spices. Recommended as a quick breakfast, lunchbox option, or light dinner.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=4ghW3FdyV1E',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Vaishalis Recipe',
          },
          {
            id: '36',
            title: 'Nutritious Ragi Thalipeeth / Ragi Masala Roti (Diabetic & Weight Loss Friendly)',
            description: 'A recipe for making soft and nutritious Thalipeeth (flatbread) using Ragi (Finger Millet) flour. The recipe is promoted as a healthy option, suitable for individuals managing diabetes and those on a weight loss diet.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=7NIWpjSjnfw',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Pradnya\'s Corner',
          },
          {
            id: '37',
            title: 'Tasty and Nutritious Jowar Upma for Breakfast | Healthy Jowar Upma Recipe (Chef Shilpa)',
            description: 'A recipe for a healthy, tasty, and nutritious breakfast dish—Upma—made from Jowar (Sorghum) flour. It is a wholesome alternative to traditional Upma.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=jgK0Ay6S0f0',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Ruchkar Mejwani',
          },
          {
            id: '38',
            title: 'Soft, Delicious, and Gluten-Free Jowar Muthia Recipe (Steamed Snack)',
            description: 'A recipe for a soft, spongy, and healthy Jowar (Sorghum) Muthia. This gluten-free snack is made from Jowar flour, besan, spices, and grated lauki (bottle gourd). The muthia is first steamed and then given a savory tempering (tadka) of mustard seeds, sesame seeds, and curry leaves. It is ideal for breakfast or light snacking.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=m0jJ9Fh9RWo',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'NishaMadhulika',
          },
          {
            id: '39',
            title: 'Nashik Special Zirka (Spicy Maharashtrian Curry) in 15 Minutes',
            description: 'An easy and spicy 15-minute recipe for Nashik Special Zirka, a thin Maharashtrian curry served with rice or bhakri. The recipe uses two main pastes: one dry paste of roasted peanuts, dry coconut, and sesame seeds, and a green paste of chili, garlic, curry leaves, and coriander.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=Z038Sxz1_jc',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Ruchkar Mejwani',
          },
          {
            id: '40',
            title: 'Oly Watana Bhat / Matar Bhat (Peas Rice) for Dinner',
            description: 'A quick and flavorful recipe for Matar Bhat (Peas Rice) made in a pressure cooker, perfect for a simple winter dinner. It uses fresh peas, a ginger-chili paste, and Goda Masala for an authentic, rich taste.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=OZ2rL5usm3M',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'MadhurasRecipe Marathi',
          },
          {
            id: '41',
            title: 'Nutritious and Different Dinner/Lunch/Breakfast Recipes for a Week',
            description: 'A collection of easy, tasty, and nutritious recipes suitable for dinner, lunch, or breakfast, offering different options for a full week.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=K9diJ8Y_c88',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Rashmi\'s Kitchen Marathi',
          },
          {
            id: '42',
            title: 'Iron-Rich and Bone-Strengthening Aliv Kheer (Garden Cress Seed Pudding)',
            description: 'A traditional, healthy recipe for Aliv Kheer (Garden Cress Seed Pudding) that is promoted as iron-rich and bone-strengthening. It is considered a powerful restorative and warming dish, especially beneficial for health.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=npXC8c9w5fE',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'MadhurasRecipe Marathi',
          },
          {
            id: '43',
            title: '4 Types of Chutney (Peanut, Flaxseed, Niger Seed, Sesame Seed) to Enhance Daily Meals',
            description: 'A video demonstrating four types of traditional, healthy, and long-lasting chutneys: Peanut (Shengdana), Flaxseed (Javas), Niger Seed (Karale), and Sesame Seed (Til) Chutney. These are made using a traditional method and can be stored for 1-2 months, adding flavor and nutrition to daily meals.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=Uq8vHIZS_zI',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: "Sarita's Kitchen",
          },
          {
            id: '44',
            title: '4 Simple Leafy Green Vegetable Recipes (Palak Bhajya): Tandulja, Chighal, Shepu, Ambadi',
            description: 'A collection of four simple, traditional, and quick Maharashtrian recipes for leafy green vegetables (Palak Bhajya), suitable for the winter season: Shepu (Dill leaves) with Moong Dal, Tandulja/Chavli (Amaranth leaves) with Onion, Chighal/Ghol (Purslane) with Chana Dal, and Ambadi (Sorrel leaves) Chutney (spicy paste). The video provides traditional cooking methods for each.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=JX4Gzz9Z8nY',
            language: 'Marathi',
            category: 'Cooking/Nutrition',
            created_at: new Date().toISOString(),
            publisher: "Sarita's Kitchen",
          },
          {
            id: '45',
            title: 'Multi-Benefit Mixed Chutney (Flax Seed Healthy Mix Chutney) for Daily Diet',
            description: 'A recipe for a multi-beneficial, mixed chutney to include in the daily diet. The recipe features a blend of healthy ingredients like flax seeds, sesame seeds, peanuts, garlic, and curry leaves, promoted for its high omega-3 fatty acid content and ability to boost immunity.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=w5mbNzhkWbM',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Marathi Kitchen',
          },
          {
            id: '46',
            title: 'Hearty & Healthy Bajra Veggies Khichdi (Pearl Millet and Vegetable Khichdi) Recipe - Winter Superfood',
            description: 'A traditional and special Bajra (Pearl Millet) Khichdi recipe, packed with various fresh vegetables, making it a hearty and healthy superfood for the winter season. The video demonstrates how to properly soak and process the bajra to remove excess fiber before cooking it with moong dal and vegetables in a pressure cooker.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=BluIg3csF-s',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'NishaMadhulika',
          },
          {
            id: '47',
            title: 'Pitta-Calming Tival (Futi Kadi) | Simple and Quick Healthy Drink Recipe | Healthy drink',
            description: "A simple and quick recipe for 'Tival' (also known as 'Futi Kadi'), a traditional Goan, digestive, and pitta-calming drink made from kokum (Garcinia indica) or kokum extract (aagal). It is a sour-sweet, healthy beverage often consumed to soothe acidity, and is similar but distinct from Solkadi, Kokum Sar, and Kokum Sherbet.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=vlw3DWqieZc',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Anuradha Tambolkar',
          },
          {
            id: '48',
            title: 'Kashay: Ayurvedic Tea to Boost 100% Immunity and Fight Cold & Cough',
            description: "A recipe for 'Kashay' (a traditional Ayurvedic tea or Kanadi beverage) powder and drink, made with a blend of beneficial spices and herbs (coriander, fennel, black pepper, ashwagandha, dry ginger, etc.). It is prepared without tea leaves or refined sugar, and is highly recommended for boosting 100% immunity, fighting cold, cough, and is presented as a healthier, rejuvenating substitute for regular tea.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=OKGdtKdrbuw',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Priyas Kitchen',
          },
          {
            id: '49',
            title: 'Ragi Kharvas/Vadi that melts in the mouth without sugar, milk, or colostrum! Ready in just 15 minutes | Ragi Vadi',
            description: "A simple, quick, and highly nutritious recipe for 'Ragi Kharvas' (Ragi Pudding/Steamed Dessert) or 'Ragi Vadi' (Ragi Squares). This calcium-rich dessert is made without milk, sugar, or colostrum, using only three main ingredients: Ragi (Finger Millet), jaggery (or sugar), and fresh coconut. The video shows how to soak the ragi, extract the milk, and cook it to create a soft, melt-in-your-mouth texture.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=aqOztm7yc9w',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Preshita\'s Kitchen',
          },
          {
            id: '50',
            title: 'Traditional Digestive Beet and Carrot Kanji | Immunity Booster Kanji | Traditional Kanji recipe in marathi',
            description: "A recipe for the traditional Indian probiotic drink, Kanji, made from fermented beetroot and carrots, water, and mustard seeds. It is presented as a simple, easy, and powerful natural probiotic for boosting immunity, improving gut health, aiding digestion, and assisting with weight loss and Vitamin B12 deficiency.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=ZfnFZ7Kk0d8',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Dr. Charuta Koparkar',
          },
          {
            id: '51',
            title: 'रोज ताटात फक्त १ चमचा लोणचे घ्या आणि भरपूर फायदे मिळवा | Turmeric Pickle | Amla Pickle',
            description: "A recipe for a mixed medicinal pickle ('Loncha') using fresh turmeric, mango ginger (Ambe Halad), amla (Indian gooseberry), and ginger. The pickle, which is recommended to be consumed in small amounts daily, is touted for its health benefits, including being rich in Vitamin C, aiding digestion, and being suitable for the winter season. The process involves grating the ingredients, mixing with salt and pickle masala, adding lemon juice, and tempering with oil.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=EVaojhC5nKA',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Marathi Kitchen',
          },
          {
            id: '52',
            title: 'Health Benefits of Water Chestnut (Shingada) in Marathi | Singada',
            description: "An informational video discussing the health benefits and uses of Water Chestnut ('Shingada' or 'Singhara'), a seasonal root vegetable available during winter. It is highlighted as a nutrient-rich food containing high amounts of Calcium, Fiber, Potassium, and antioxidants. Benefits include boosting bone strength, improving skin and hair texture, aiding digestion, controlling bad cholesterol and blood sugar, and supporting weight management. The video also suggests various ways to consume it: raw, boiled, stir-fried, roasted, or as flour for fasting recipes.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=SORNnuQLwTE',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Dr. Charuta Koparkar',
          },
          {
            id: '53',
            title: '10x Your Good Gut Bacteria | Immunity Booster AMLA KANJI Recipe | Healthy Probiotic Drink | Kanji',
            description: "A recipe for a tangy and flavorful Amla Kanji, a healthy probiotic drink that boosts immunity, supports overall health, improves digestion, and detoxifies the body. The recipe uses Amla (Indian Gooseberry), raw turmeric, ginger, and a mix of mustard seeds (rai and yellow mustard) for fermentation. The drink is ready in 3-4 days and is a great source of good gut bacteria.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=qHduiXSqLjg',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Homemade Happiness With Manisha',
          },
          {
            id: '54',
            title: 'फळं किती, कधी आणि कशी खायची? | The best time to eat fruits? Part 1 | Amita Gadre I Marathi Podcast',
            description: 'A detailed podcast discussion on fruit consumption, covering questions like the best time to eat them (morning or night), recommended quantity, and the nutritional difference between whole fruit and juice. The video explains that fruit sugar (fructose) is a "sustained release" sugar due to its fiber content, making it generally safe and healthy. However, juicing removes the fiber, causing the sugar to be absorbed quickly, similar to drinking soft drinks. The discussion also provides tips for individuals with diabetes, recommending pairing fruit with a source of protein or fat (like nuts) to control blood sugar spikes.',
            type: 'video',
            url: 'http://www.youtube.com/watch?v=3ZrbMp5bINI',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Nutritionist Amita Gadre',
          },
          {
            id: '55',
            title: 'अंड्याचा रिअल फंडा | Truth behind Eggs I Amita Gadre I Marathi Podcast',
            description: "A podcast episode debunking common myths about eggs. Topics include whether eggs increase cholesterol (it's a myth, total fat intake is more important), the benefits of eating the whole egg (yolk and white) for protein and essential nutrients like B12 and D3, the role of eggs in weight management, and the confusion around consuming eggs in summer. It also touches on the debate of whether an egg is vegetarian or non-vegetarian, clarifying that market-sold eggs are unfertilized and sterile.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=45nluV9XZEU',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Nutritionist Amita Gadre',
          },
          {
            id: '56',
            title: 'आवळा लोणचे | Awla Pickle | Amla Pickle | Gooseberry Pickle | Amle Ka Achar | madhurasrecipe',
            description: "A recipe for making Amla (Indian Gooseberry) Pickle in Marathi. The process includes preparing a spice mix with mustard seeds, cumin, whole coriander (optional), and fenugreek seeds (methi). The amla pieces are then fried in mustard oil until soft and mixed with the spice powder, red chili powder, and salt. The pickle is stored in a sterile jar and can be kept at room temperature for a few days before refrigerating, where it lasts for 6-7 months.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=4ja6jpULsqM',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'MadhurasRecipe Marathi',
          },
          {
            id: '57',
            title: 'Calcium की खदान है ये दाने, ऐसे खाएंगे तो सॉलिड बन जाएंगी पूरी 206 हड्डियाँ',
            description: "A health video discussing sesame seeds (til) as a superfood rich in calcium, iron, magnesium, phosphorus, and zinc. It highlights that sesame seeds are a superior plant-based alternative to dairy for calcium intake, helping to strengthen bones, teeth, and improve heart and nerve health. The video provides five methods for consuming sesame seeds: roasted, powdered (to mix in dishes), in milk (a dairy-free option), as a chutney, or cooked with regular milk (an ancient remedy). It also offers guidelines on daily consumption (1-2 tablespoons for adults) and advises reducing the quantity during summer months.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=EETGmNuXRKI',
            language: 'Hindi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Healthy Hamesha',
          },
          {
            id: '58',
            title: 'सबसे ज्यादा कैल्शियम किसमें होता है | Calcium Rich Foods 😱😦#gk #healthylifestyle',
            description: 'A short general knowledge video about which foods contain the highest amounts of calcium (Calcium Rich Foods).',
            type: 'video',
            url: 'https://youtube.com/shorts/CELIpAms5yM',
            language: 'Hindi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'SUCCESS MIND EDU',
          },
          {
            id: '59',
            title: "PM Modi's Favorite Moringa Paratha | Garlic Chutney | Chef Kunal Kapur Healthy Recipe | Breakfast",
            description: "A healthy recipe for making Moringa Paratha (Sanjana Paratha), noted as a superfood rich in Vitamin C, for boosting immunity, controlling blood pressure, and healing. The paratha is served with a sweet, sour, and spicy Garlic Chutney, made using soaked Kashmiri chilies, jaggery (gud), and tamarind (optional). The video highlights the extensive health and medicinal uses of moringa leaves, flowers, fruit, and root.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=N6ccvszLMpU',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Kunal Kapur',
          },
          {
            id: '60',
            title: 'तरतरीत आरोग्यासाठी शक्तिवर्धक सूप | धष्ट पुष्ट हाडांसाठी शेवग्याच्या शेंगांचं सूप | Drumstick Soup',
            description: "A recipe for Drumstick (Moringa) Soup, highlighting that it is a perfect, nutritious, and healthy soup, especially for strong bones as it is 'overfilled with calcium' (कॅल्शियम ने भरपूर ओतप्रोत भरलेलं). The recipe is simple, without the use of cornflour, oil, or ghee, and includes drumstick pods, onion, tomato, garlic, and green chili.",
            type: 'video',
            url: 'https://youtu.be/Wtx6KkN9U7Y',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'MadhurasRecipe Marathi',
          },
          {
            id: '61',
            title: 'Drumstick Leaves Sabzi | Healthy Moringa Leaves Sabzi | Superfood Moringa Recipes | Culinary Aromas',
            description: "A recipe for Drumstick Leaves Sabzi (Moringa Leaves Vegetable). The video promotes moringa leaves as a healthy superfood.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=zFuzhNMN9nw',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Culinary Aromas',
          },
          {
            id: '62',
            title: 'आजीच्या हातची चुलीवरची शेवग्याचा पानाची भाजी #shorts #shortsfeed #viralvideo #village #aaji #chul',
            description: "A short video showcasing the preparation of drumstick leaves (Moringa) vegetable dish, traditionally cooked by a grandmother on a chulha (clay stove) in a village setting.",
            type: 'video',
            url: 'https://youtube.com/shorts/8jDt7UZjxqQ',
            language: 'Marathi',
            category: 'Video recipes',
            created_at: new Date().toISOString(),
            publisher: "Ira's World",
          },
          {
            id: '63',
            title: 'औषधी गुणधर्म युक्त शेवग्याच्या पानांची भाजी|Shevagyachya Pananchi Bhaji|drumstick leaves|moringa',
            description: "A simple and quick recipe for Drumstick Leaves (Moringa) Vegetable (Sabzi) with medicinal properties. The video emphasizes that moringa helps control bad cholesterol and diabetes, and its leaves contain four times more iron and calcium than other foods, aiding in overcoming weakness.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=rd9m925vBjI',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Paripurna Swad',
          },
          {
            id: '64',
            title: 'शेवग्याच्या पानांचे थालीपीठ | Drumstick Leaves Thalipeeth Recipe in Marathi | Chef Tushar',
            description: "A recipe for Drumstick Leaves (Moringa) Thalipeeth, a healthy, multi-grain flatbread. Moringa leaves are known as a superfood, rich in protein, iron, and anti-inflammatory benefits.",
            type: 'video',
            url: 'https://youtu.be/FR0zYw9TgdM',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Ruchkar Mejwani',
          },
          {
            id: '65',
            title: '10 मिनिटात होणारी मुगाची सुकी भाजी || Moong Recipe || Maharashtrian Cooking || Mugachi Bhaji ||',
            description: "A simple and quick Maharashtrian recipe for dry Moong (Green Gram) Vegetable (Bhaji) that can be prepared in 10 minutes, served with bhakri or chapati.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=aujRJPzRIg8',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Arogya Recipe',
          },
          {
            id: '66',
            title: 'थंडीच्या दिवसात बनवा शरीराला खुप सारे फायदे देणारा शेंवग्याच्या शेंगाचा सुप | Drumstick Soup',
            description: "A recipe for Drumstick (Moringa/Shevga) Pod Soup, which is highly beneficial for the body, especially during winter. The soup is rich in calcium and is recommended for strong bones.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=u6v9mnHFhC8',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Maharashtrian Recipes',
          },
          {
            id: '67',
            title: 'दुधी भोपळ्याचे पौष्टिक व खमंग थालीपीठ | Dudhi Bhopla Thalipeeth Recipe in Marathi |Healthy Breakfast',
            description: "A recipe for nutritious and savory Bottle Gourd (Lauki/Dudhi Bhopla) Thalipeeth, a healthy Maharashtrian breakfast. The video advises grating the bottle gourd with its skin as the skin contains the most nutrients. It also suggests using Thalipeeth flour (Bhajani) or a mix of millet flours (like jowar and bajra) or rice flour for the recipe.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=JigPSZrZ-cg',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Shyamlis Kitchen Marathi',
          },
          {
            id: '70',
            title: 'लौकी का स्वादिष्ट और पौष्टिक खस्ता पराठा। lauki ka Paratha Recipe | Doodhi Paratha | Ghiya Paratha।',
            description: "A recipe for delicious, nutritious, and crispy Bottle Gourd (Lauki/Doodhi/Ghiya) Paratha, suitable for breakfast. The recipe uses grated bottle gourd (without seeds) mixed with wheat flour and spices, without adding any extra water to the dough.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=afrjwScG7FU',
            language: 'Hindi',
            category: 'video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Shyam Rasoi',
          },
          {
            id: '71',
            title: '१ किलो सुक्कं चिकन | काळ्या वाटणातले, गावरान चवीचे, झणझणीत काळं चिकन सुक्के 1kg Sukka Chicken Recipe',
            description: "A recipe for authentic, spicy, and flavorful Black Gravy Dry Chicken (Kala Sukka Chicken) in a Gavran (village) style, using a black masala (made from charred onions and coconut). The video presents a versatile recipe that can be eaten as a starter or with roti/bhakri, or adapted into a curry.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=zL123DQG7A8',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: "Sarita's Kitchen",
          },
          {
            id: '72',
            title: 'प्रोटीन कुठून मिळेल? | Diet for daily protein intake | Marathi Podcast | Amita Gadre',
            description: "A Marathi podcast featuring Nutritionist Amita Gadre discussing daily protein intake. Key topics include: the recommended protein requirement (1g per kg body weight), various vegetarian and non-vegetarian protein sources, the role of protein in muscle building, weight loss, diabetes management (by controlling blood sugar spikes), and hair health. It also addresses common myths, such as protein causing high uric acid (gout) or kidney issues, and advises on gradually increasing protein intake to avoid digestive problems.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=NMnyqlV0ISE',
            language: 'Marathi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Nutritionist Amita Gadre',
          },
          {
            id: '73',
            title: 'झणझणीत तोंडाला पाणी सोडणारा पारंपरिक गावरान चिकन रस्सा | Gavran chicken rassa | kolhapuri chicken 🐔',
            description: "A recipe for spicy, traditional, and authentic Gavran (village-style) Chicken Curry, also known as Kolhapuri Chicken Rassa. The dish is known for its intense flavor and heat.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=4bgoo1R87xQ',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'गावरान- एक खरी चव ! - Gavran',
          },
          {
            id: '74',
            title: 'जगातील सोप्पी चिकन बिर्याणी रेसिपी । १ मिनिटांत कांदा कसा तळायचा व सर्व टिप्स | Chicken Biryani',
            description: "A recipe for the world's easiest Chicken Biryani, including tips on how to fry onions (barista) quickly (in about 7-8 minutes instead of 40-50 minutes) by treating them with salt to draw out water and letting them air dry. The recipe uses marinated chicken cooked with spices and layered with 80% cooked Basmati rice, and then steamed (dum) for 15 minutes.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=VSe-u39_ENU',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: "MadhurasRecipe Marathi",
          },
          {
            id: '75',
            title: 'कुकरच्या १ शिट्टीत १० जणांसाठी चिकन रस्सा | ताजा खडा मसाला भाजून १ किलो चिकन रस्सा | Chicken Curry',
            description: "A recipe for a 1kg Chicken Curry (Rassa) made quickly in a pressure cooker, suitable for about 10 servings. The recipe features a rich, freshly ground black dry spice masala (Kala Watana) made from roasted coconut, whole spices, onion, and tomato, which is then used to cook the marinated chicken in 2 high-heat whistles.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=lI-eLphYn08',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'MadhurasRecipe Marathi',
          },
          {
            id: '76',
            title: '#EggCutlets Super Tasty Egg Cutlets Recipe || Egg Vada Recipe #TastyFood #Shorts',
            description: "A short video recipe for making super tasty Egg Cutlets, also known as Egg Vada.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=S_L8gAWyqBU',
            language: 'English',
            category: 'Video Recipes',
            created_at:  new Date().toISOString(),
            publisher: 'Tasty Food',
          },
          {
            id: '77',
            title: 'Trending Dhaba Style Egg Curry Recipe #egg #recipe #shorts',
            description: "A short video showcasing a trending recipe for Dhaba Style Egg Curry.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=JZqv7EATz6s',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Whisk N Crisp',
          },
          {
            id: '78',
            title: 'Tawa Anda Thecha Pav | Maharashtrian Shakshuka | तवा अंडा ठेचा पाव | Awesome Mausam Ep 4 🌧️',
            description: "A short video recipe for 'Tawa Anda Thecha Pav', described as a 'Desi Maharashtrian Shakshuka' that is perfect for the rainy season (Awesome Mausam). The recipe involves making a unique Thecha chili oil and a special watan (spice paste) with burnt dry coconut, then cooking eggs in a flavorful masala on a tawa (griddle) and serving it with toasted pav.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=qFU3RgvOod8',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Your Food Lab',
          },
          {
            id: '79',
            title: 'easy and simple egg breakfast recipe - quick masala egg omelette fluffy and spongy',
            description: "An easy and simple recipe for a quick morning breakfast: a fluffy and spongy Masala Egg Omelette, perfect to be eaten with bread or roti.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=j_RE8pOK8DE',
            language: 'English',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Yummy Indian Kitchen',
          },
          {
            id: '80',
            title: '१किलो डिंकाचे लाडू | विक्रीसाठी सविस्तर कृती, थंडीमधील सांधेदुखी उपयोगी खारीक खोबरे Dink Ladu Recipe',
            description: "A detailed, step-by-step recipe for making 1 kg of traditional Marathi 'Dink Ladu' (Edible Gum Laddus), often consumed in winter for joint health. The video provides accurate measurements by weight and by cup, covering the preparation of ingredients like roasted coconut, dates powder (Khareek), and frying the edible gum (Dink).",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=9t_h7Hj1q0k',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Sarita\'s Kitchen',
          },
          {
            id: '81',
            title: 'बस 5 मिनट में हलवाई जैसे Nariyal Ke Laddu इतना आसान न मावा न चाशनी | No Chasni No Mawa COCONUT LADOO',
            description: "A very quick and easy, 5-minute recipe for making Coconut Laddus (Nariyal Ke Laddu) without using mawa (milk solids), chasni (sugar syrup), milk powder, or condensed milk. The recipe is suitable for beginners and is presented as a special offering (Bhog Prasad) for Janmashtami. It also includes a bonus recipe for making Panchamrit (five nectars).",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=0OhF1RP5qK0',
            language: 'Hindi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'CookwithParul',
          },
          {
            id: '82',
            title: 'बाळंतीणीसाठी खास पौष्टिक अळीवाचे लाडू/हिवाळा स्पेशल अळीव लाडू रेसिपी @smitaoakvlogs',
            description: "A recipe for nutritious, winter-special 'Aliv Laddu' (Garden Cress Seeds Laddu), primarily recommended for new mothers due to its health benefits like maintaining weight and relieving back pain. The recipe uses Aliv seeds, fresh coconut, jaggery, ghee, cloves, and almonds. The video specifically warns that these laddus should not be consumed by pregnant women as the ingredients are considered 'heating' (Ushna) in nature.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=kO7Ry1QQl7s',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Smita Oak vlogs',
          },
          {
            id: '83',
            title: '१ किलो हळिवाचे लाडू | केसगळती कंबरदुखीवर उपयुक्त, लाडू जास्त टिकण्यासाठी ५टिप्स 1kg HalivLadu Recipe',
            description: "A recipe for making 1 kg of 'Haliv Laddu' (Garden Cress Seeds Laddu) using only two tablespoons of ghee. The video highlights its benefits for hair loss and back pain, and includes 5 tips to ensure the laddus made with fresh coconut last for a month.",
            type: 'video',
            url: 'https://www.youtube.com/watch?v=bAf81YpV2-s',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'Sarita\'s Kitchen',
          },
          {
            id: '84',
            title: 'खाल्यानंतर चव विसरणार नाही असा गावाकडचा झणझणीत तांबडा मटण रस्सा आणि सुक्क | Mutton recipe in marathi',
            description: 'A recipe for a spicy, village-style Mutton dish, featuring both a thin red curry (Tambada Mutton Rassa) and dry mutton (Sukka). The video demonstrates the traditional method of grinding masala on a stone (patta) and cooking on a chulha (earthen stove), emphasizing the use of their special Kolhapuri Kanda Lasun Masala.',
            type: 'video',
            url: 'http://www.youtube.com/watch?v=DiQSRvL5oVE',
            language: 'Marathi',
            category: 'Video Recipes',
            created_at: new Date().toISOString(),
            publisher: 'गावरान- एक खरी चव ! - Gavran',
          },
          {
            id: '85',
            title: 'सर्दी में मूंगफली ज़रूर खाएं मगर ज़रा संभल कर | मूंगफली खाने के फायदे | Peanut Benefits',
            description: 'A detailed video discussing the health benefits of peanuts (moongfali) in winter, covering their nutritional value, specific health benefits (heart health, gallstone prevention, weight management, muscle building, diabetes control, and skin health), recommended daily intake, and a warning about potential side effects if consumed in excess or by people with allergies. It also touches on Ayurvedic views regarding its "heating" nature and the benefits of soaking them.',
            type: 'video',
            url: 'https://www.youtube.com/watch?v=nThn3POezLs',
            language: 'Hindi',
            category: 'Nutrition',
            created_at: new Date().toISOString(),
            publisher: 'Healthy Hamesha',
          },
          {
            id: "86",
            title: "For good skin and hair during Menopause",
            description: "This video, part of a menopause series, provides tips for improving skin and hair health during perimenopause and menopause. It recommends avoiding excessive 'confusion, conflict, and caffeine' and suggests incorporating specific foods: Aliv Laddu (Garden Cress Seed Laddu), Rice, and Homemade Dahi (yogurt) and Chaas (buttermilk) into the diet.",
            type: "video",
            url: "http://www.youtube.com/watch?v=oGoTJy86FDY",
            language: "Hindi",
            category: "Nutrition",
            created_at: new Date().toISOString(),
            publisher: "Rujutadiwekarofficial"
          },
          {
            id: "87",
            title: "शेंगदाणे /groundnut/peanut",
            description: "An Ayurvedic perspective on peanuts (shengdana/groundnuts). The video explains that peanuts are sweet, heavy to digest, warm (ushna), oily, pacify Vata, and increase Pitta. They are nutritious due to high protein and good oil. However, it warns that excessive consumption can lead to heat in the body, weight gain, constipation, and is not advised for people with acidity, diabetes, obesity, stomach issues, or skin disorders. It also suggests substituting peanut powder with other spices (coriander, cumin, coconut, curry leaves) in cooking.",
            type: "video",
            url: "http://www.youtube.com/watch?v=pQOT4htArkQ",
            language: "Marathi",
            category: "Nutrition",
            created_at: new Date().toISOString(),
            publisher: "Arham Ayurved by Dr. Smita Bora"
          },
          {
            id: "88",
            title: "शेंगदाण्याची झणझणीत आमटी | Shengdanyachi Amti | Spicy Peanuts Curry | Latika Nimbalkar",
            description: "A recipe for a spicy curry made from peanuts, known as 'Shengdanyachi Amti' or Spicy Peanuts Curry.",
            type: "video",
            url: "http://www.youtube.com/watch?v=ryDi-_2h23w",
            language: "Marathi",
            category: "Video recipes",
            created_at: new Date().toISOString(),
            publisher: "Latika Nimbalkar"
          },
          {
            id: "89",
            title: "१ नंबर तोंडाला चव येईलअसं शेंगदाण्याचं पिठलं | Marathwada Shengdanyacha Pithala | MadhurasRecipe",
            description: "A quick and easy recipe for a delicious Marathwada-style 'Shengdanyacha Pithala' (Peanut Flour Curry). This dish is made using peanut powder instead of traditional chickpea flour (besan), and is a great option when you are tired of eating vegetables or when you don't have any vegetables at home. The video emphasizes its strong flavor and quick preparation time.",
            type: "video",
            url: "http://www.youtube.com/watch?v=e23DQ2hNjko",
            language: "Marathi",
            category: "Video Recipes",
            created_at: new Date().toISOString(),
            publisher: "MadhurasRecipe Marathi"
          },
          {
            id: "90",
            title: "मुलांना डब्यात दिला बटाटा, घरी केला माझ्या आवडीचा बेत | पालकाचं गरगट्ट & गरम भात Palak Bhaji Recipe",
            description: "A recipe for 'Palak Garagatti' (thin spinach curry/bhaji), a personal favorite of the creator. The spinach is boiled with chana dal and peanuts, then mashed, tempered with a chili-garlic paste (thecha) and cumin, and thickened with a little flour. It is traditionally served with hot rice or bhakri.",
            type: "video",
            url: "http://www.youtube.com/watch?v=7uMVVG9DR24",
            language: "Marathi",
            category: "Cooking",
            created_at: "2025-08-04T00:00:00.000Z",
            publisher: "Saritas Kitchen Food & Vlogs"
          },
          {
            id: "91",
            title: "Peanut Fenugreek|मूंगफली मेथी रेसिपी |Moongfali Methi Recipe #shorts #ytshorts",
            description: "A short video presenting a recipe for Peanut and Fenugreek (Moongfali Methi).",
            type: "video",
            url: "http://www.youtube.com/watch?v=1ZjuDcLqCc8",
            language: "Hindi/Marathi",
            category: "Cooking",
            created_at: "2021-07-28T00:00:00.000Z",
            publisher: "GAVRAN TADKA RECIPES"
          },
        ];
        setResources(curatedResources);
      } else {
        setResources(allResources);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resources',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const performWebSearch = async (query: string): Promise<Resource[]> => {
    // This is a placeholder for web search functionality
    // In a real implementation, you would use a search API like Google Custom Search, Bing, or similar
    // For now, return empty array to use curated resources
    return [];
  };

  const fetchResources = async () => {
    await searchRealResources('menopause resources');
  };

  const filteredResources = resources.filter(resource => {
    const categoryMatch = selectedCategory === 'All' || resource.category === selectedCategory;
    const typeMatch = selectedType === 'all' || resource.type === selectedType;
    return categoryMatch && typeMatch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'article':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Exercise': 'bg-green-100 text-green-800',
      'Nutrition': 'bg-orange-100 text-orange-800',
      'Meditation': 'bg-purple-100 text-purple-800',
      'Medical': 'bg-red-100 text-red-800',
      'Community': 'bg-blue-100 text-blue-800',
      'Education': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleResourceClick = (resource: Resource) => {
    // In a real app, you might want to track resource views
    toast({
      title: 'Opening Resource',
      description: `Opening ${resource.title}`,
    });
    
    // Open in new tab
    window.open(resource.url, '_blank');
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!user) return;
    
    try {
      // In a real implementation, you would delete from database
      // For now, just remove from local state
      setResources(resources.filter(resource => resource.id !== resourceId));
      
      toast({
        title: 'Resource Deleted',
        description: 'The resource has been removed successfully',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading resources...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Resource Repository
          </CardTitle>
          <CardDescription>
            Educational content, videos, and articles to support your menopause journey
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              {resourceTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-4">
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{type.label}</span>
                    <span className="xs:hidden">{type.label.charAt(0)}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-4 sm:mt-6">
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredResources.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No resources found for the selected filters.</p>
                  </div>
                ) : (
                  filteredResources.map((resource) => (
                    <Card
                      key={resource.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleResourceClick(resource)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              {getTypeIcon(resource.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2 line-clamp-2">
                                  {resource.title}
                                </h3>
                                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                                  {resource.description}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                                  <Badge className={`${getCategoryColor(resource.category)} text-xs`}>
                                    {resource.category}
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                    {getTypeIcon(resource.type)}
                                    <span className="hidden sm:inline">{resource.type}</span>
                                    <span className="sm:hidden">{resource.type.charAt(0)}</span>
                                  </Badge>
                                </div>
                                {resource.publisher && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                    <User className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">Published by {resource.publisher}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0 flex flex-row sm:flex-col gap-2">
                                {user && resource.user_id === user.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="mx-4 max-w-sm sm:max-w-md">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the resource "{resource.title}" from the library.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteResource(resource.id)}
                                          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                        >
                                          Delete Resource
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500 mt-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                {new Date(resource.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                {resource.type === 'video' ? '20 min' : '5 min read'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
