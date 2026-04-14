import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma: any = new PrismaClient()

async function main() {
  console.log('🌱 シードデータの投入を開始します...')

  const company = await prisma.company.upsert({
    where: { companyId: 'demo-company' },
    update: { name: 'デモ会社' },
    create: {
      companyId: 'demo-company',
      name: 'デモ会社'
    }
  })

  // 箱タイプの作成
  const boxTypes = []
  const boxTypeData = [
    {
      size: '22x22',
      name: 'B1',
      price: 220,
      description: ''
    },
    {
      size: '25.5x22',
      name: 'B2',
      price: 220,
      description: ''
    },
    {
      size: '28.5x22',
      name: 'B3',
      price: 275,
      description: ''
    },
    {
      size: '32.5x22',
      name: 'B4',
      price: 275,
      description: ''
    },
    {
      size: '35x22',
      name: 'B5',
      price: 330,
      description: ''
    },
    {
      size: '37.5x22',
      name: 'B6',
      price: 330,
      description: ''
    },
    {
      size: '39x22',
      name: 'B7',
      price: 330,
      description: ''
    },
    {
      size: '42x22',
      name: 'B8',
      price: 385,
      description: ''
    },
    {
      size: '45x22',
      name: 'B9',
      price: 385,
      description: ''
    }
  ]

  for (const boxType of boxTypeData) {
    try {
      const createdBoxType = await prisma.boxType.upsert({
        where: {
          companyId_size: {
            companyId: company.id,
            size: boxType.size,
          }
        },
        update: {},
        create: {
          companyId: company.id,
          size: boxType.size,
          name: boxType.name,
          price: boxType.price,
          description: boxType.description,
          isActive: true
        }
      })
      boxTypes.push(createdBoxType)
      console.log(`✅ 箱タイプを作成しました: ${boxType.name} (${boxType.size})`)
    } catch (error) {
      console.log(`ℹ️ 箱タイプ「${boxType.name}」は既に存在します`)
      const existingBoxType = await prisma.boxType.findUnique({
        where: {
          companyId_size: {
            companyId: company.id,
            size: boxType.size,
          }
        }
      })
      if (existingBoxType) boxTypes.push(existingBoxType)
    }
  }

  // 管理者ユーザーの作成
  const hashedPassword = await bcrypt.hash('I9mJCaDrscR06kV', 12)
  
  try {
    const adminUser = await prisma.adminUser.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: '管理者',
        role: 'super_admin',
        companyId: company.id
      }
    })
    console.log('✅ 管理者ユーザーを作成しました:', adminUser.email)
  } catch (error) {
    console.log('ℹ️ 管理者ユーザーは既に存在します')
  }

  // カテゴリーの作成
  const categories: any[] = []
  
  // 和菓子のカテゴリーを追加
  const categoryNames = [
   '季節限定',
   '餡もの',
   'まんじゅう',
   '焼きまんじゅう', 
   '羊羹',
   '求肥',
   '干菓子'
  ]

  for (const categoryName of categoryNames) {
    try {
      const category = await prisma.category.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: categoryName,
          }
        },
        update: {},
        create: {
          companyId: company.id,
          name: categoryName,
          description: `${categoryName}の和菓子`
        }
      })
      categories.push(category)
      console.log(`✅ カテゴリーを作成しました: ${categoryName}`)
    } catch (error) {
      console.log(`ℹ️ カテゴリー「${categoryName}」は既に存在します`)
      const existingCategory = await prisma.category.findUnique({
        where: {
          companyId_name: {
            companyId: company.id,
            name: categoryName,
          }
        }
      })
      if (existingCategory) categories.push(existingCategory)
    }
  }

  if (categories.length === 0) {
    console.log('❌ カテゴリーが作成されませんでした')
    return
  }

  // 商品の作成
  const products = []
  
  // カテゴリーIDを取得する関数
  const getCategoryId = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    return category?.id || categories[0]?.id
  }

  // 商品データの定義（テスト用の固定IDを使用）
  const productData = [
    {
     id: 'test-product-001',
     name: '若草３入',
     category: '求肥',
     price: 700,
     size: '10.8x7.3',
     description: '松平不昧公の御歌から命名された当店の代表銘菓。独自の製法によるふっくらとした求肥に薄緑の寒梅粉をつけたもので、萌ゆる緑が印象的です。',
     allergyInfo: '該当無し',
     calories: 153,
     beforeImagePath: '/images/wagashi/n_wakakusa3.png',
     afterImagePath: '/images/wagashi/s_wakakusa3.png',
     ingredients: '砂糖（国内製造）、もち米（島根県奥出雲町産）、麦芽糖、砂糖結合水飴、米粉、水飴/着色料（黄４、黄５、青１）',
     nutritionInfo: '1個平均45ｇ当たり　エネルギー: 153kcal、たんぱく質: 0.5g、脂質: 0.1g、炭水化物: 37.4g、食塩相当量0g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
  {
     id: 'test-product-002',
     name: '若草６入',
     category: '求肥',
     price: 1400,
     size: '7.3x21',
     description: '松平不昧公の御歌から命名された当店の代表銘菓。独自の製法によるふっくらとした求肥に薄緑の寒梅粉をつけたもので、萌ゆる緑が印象的です。',
     allergyInfo: '該当無し',
     calories: 153,
     beforeImagePath: '/images/wagashi/n_wakakusa6.png',
     afterImagePath: '/images/wagashi/s_wakakusa6.png',
     ingredients: '砂糖（国内製造）、もち米（島根県奥出雲町産）、麦芽糖、砂糖結合水飴、米粉、水飴/着色料（黄４、黄５、青１）',
     nutritionInfo: '1個平均45ｇ当たり　エネルギー: 153kcal、たんぱく質: 0.5g、脂質: 0.1g、炭水化物: 37.4g、食塩相当量0g ',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
  {
     id: 'test-product-003',
     name: '若草９入',
     category: '求肥',
     price: 2100,
     size: '10.3x21',
     description: '松平不昧公の御歌から命名された当店の代表銘菓。独自の製法によるふっくらとした求肥に薄緑の寒梅粉をつけたもので、萌ゆる緑が印象的です。',
     allergyInfo: '該当無し',
     calories: 153,
     beforeImagePath: '/images/wagashi/n_wakakusa9.png',
     afterImagePath: '/images/wagashi/s_wakakusa9.png',
     ingredients: '砂糖（国内製造）、もち米（島根県奥出雲町産）、麦芽糖、砂糖結合水飴、米粉、水飴/着色料（黄４、黄５、青１）',
     nutritionInfo: '1個平均45ｇ当たり　エネルギー: 153kcal、たんぱく質: 0.5g、脂質: 0.1g、炭水化物: 37.4g、食塩相当量0g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-004',
     name: 'よもぎ若草３入',
     category: '求肥',
     price: 800,
     size: '10.8x7.3',
     description: '2018年の不昧公200年祭の販売からご好評いただいた「復刻若草」。「よもぎ若草」は、蓬の部分を更にこだわり、島根県産の手摘み蓬を使用することで、更に美味しくなりました。',
     allergyInfo: '該当無し',
     calories: 151,
     beforeImagePath: '/images/wagashi/n_yomogiwakakusa3.jpg',
     afterImagePath: '/images/wagashi/s_yomogiwakakusa3.png',
     ingredients: '砂糖（国内製造）、もち米（島根県奥出雲町産）、麦芽糖、砂糖結合水飴、米粉、よもぎ粉末（よもぎ（島根県産）)、水飴',
     nutritionInfo: '1個平均45ｇ当たり　エネルギー: 151kcal、たんぱく質: 0.5g、脂質: 0.1g、炭水化物: 37.4g、食塩相当量0g ',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-005',
     name: 'よもぎ若草６入',
     category: '求肥',
     price: 1600,
     size: '7.3x21',
     description: '2018年の不昧公200年祭の販売からご好評いただいた「復刻若草」。「よもぎ若草」は、蓬の部分を更にこだわり、島根県産の手摘み蓬を使用することで、更に美味しくなりました。',
     allergyInfo: '該当無し',
     calories: 151,
     beforeImagePath: '/images/wagashi/n_yomogiwakakusa6.png',
     afterImagePath: '/images/wagashi/s_yomogiwakakusa6.png',
     ingredients: '砂糖（国内製造）、もち米（島根県奥出雲町産）、麦芽糖、砂糖結合水飴、米粉、よもぎ粉末（よもぎ（島根県産）)、水飴',
     nutritionInfo: '1個平均45ｇ当たり　エネルギー: 151kcal、たんぱく質: 0.5g、脂質: 0.1g、炭水化物: 37.4g、食塩相当量0g ',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-006',
     name: '伯耆坊',
     category: '求肥',
     price: 230,
     size: '11.2x5.2',
     description: '伯耆坊は丁寧に炊き上げた小豆と寒天を合わせた小豆羹の中に求肥を入れています。表面は程よく乾燥させてあり、カリっとした口あたりではじまり、その後、小豆のやわらかい弾力、最後に求肥のもっちりとした食感を楽しめるお菓子となっています。',
     allergyInfo: '該当無し',
     calories: 121,
     beforeImagePath: '/images/wagashi/n_houkibou.jpg',
     afterImagePath: '/images/wagashi/s_houkibou1.jpg',
     ingredients: '砂糖（国内製造）、小豆、米粉、水飴、麦芽糖、寒天、砂糖結合水飴、澱粉/酵素（大豆由来）',
     nutritionInfo: 'エネルギー: 1個平均32ｇあたり　エネルギー121kcal、たんぱく質1.6g、脂質0.2g、炭水化物28.9g、食塩相当量0g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-007',
     name: '伯耆坊４入 ',
     category: '求肥',
     price: 920,
     size: '8x21',
     description: '伯耆坊は丁寧に炊き上げた小豆と寒天を合わせた小豆羹の中に求肥を入れています。表面は程よく乾燥させてあり、カリっとした口あたりではじまり、その後、小豆のやわらかい弾力、最後に求肥のもっちりとした食感を楽しめるお菓子となっています。',
     allergyInfo: '該当無し',
     calories: 121,
     beforeImagePath: '/images/wagashi/n_houkibou.jpg',
     afterImagePath: '/images/wagashi/s_houkibou4.png',
     ingredients: '砂糖（国内製造）、小豆、米粉、水飴、麦芽糖、寒天、砂糖結合水飴、澱粉/酵素（大豆由来）',
     nutritionInfo: 'エネルギー: 1個平均32ｇあたり　エネルギー121kcal、たんぱく質1.6g、脂質0.2g、炭水化物28.9g、食塩相当量0g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-008',
     name: '柚衣',
     category: '季節限定',
     price: 600,
     size: '7x10.5',
     description: '柚子の香りが豊かに広がる、彩雲堂の冬の季節菓子。国産の柚子をくり抜き、皮むき小豆餡を使用した羊羹と大粒小豆を流し入れて仕上げます。柚子は蜜漬けしておりますので、皮ごとお召し上がりいただけます。',
     allergyInfo: '該当無し',
     calories: 249,
     beforeImagePath: '/images/wagashi/n_yuzugoromo.jpg',
     afterImagePath: '/images/wagashi/s_yuzugoromo.png',
     ingredients: '蜜漬柚子（国内製造）、砂糖、小豆、葛粉、寒天、食塩/酸味料',
     nutritionInfo: '1個平均100ｇあたり　エネルギー249kcal、たんぱく質2.8g、脂質0.3g、炭水化物59.5g、食塩相当量0.08g ',
     shelfLife: '出荷日を含め30日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-009',
     name: '柚衣２入',
     category: '季節限定',
     price: 1200,
     size: '7x21',
     description: '柚子の香りが豊かに広がる、彩雲堂の冬の季節菓子。国産の柚子をくり抜き、皮むき小豆餡を使用した羊羹と大粒小豆を流し入れて仕上げます。柚子は蜜漬けしておりますので、皮ごとお召し上がりいただけます。',
     allergyInfo: '該当無し',
     calories: 249,
     beforeImagePath: '/images/wagashi/n_yuzugoromo.jpg',
     afterImagePath: '/images/wagashi/s_yuzugoromo2.png',
     ingredients: '蜜漬柚子（国内製造）、砂糖、小豆、葛粉、寒天、食塩/酸味料',
     nutritionInfo: '1個平均100ｇあたり　エネルギー249kcal、たんぱく質2.8g、脂質0.3g、炭水化物59.5g、食塩相当量0.08g ',
     shelfLife: '出荷日を含め30日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
   {
     id: 'test-product-010',
     name: '願ひ菓子',
     category: '干菓子',
     price: 800,
     size: '10.8x10.5',
     description: '勾玉の形をした、ひと口サイズの干菓子です。 「いちご」「ココア」「柚子」「和三盆」「抹茶」の5種類の味があり、口の中に入れるとゆっくりゆっくり優しく溶けていきます。願い事をしながらお召し上がりください。',
     allergyInfo: '該当無し',
     calories: 0,
     beforeImagePath: '/images/wagashi/n_negaigasi.jpg',
     afterImagePath: '/images/wagashi/s_negaigasi.jpg',
     ingredients: '和三盆糖（国内製造）、ストロベリーパウダー、ココアパウダー、柚子果皮粉末、抹茶/着色料（赤３、赤１０６、黄４、黄５、青１）',
     nutritionInfo: '1個6ｇあたり エネルギー23kcal、たんぱく質0g、脂質0g、炭水化物5.9g、食塩相当量0g',
     shelfLife: '出荷日を含め90日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
   {
     id: 'test-product-011', 
     name: 'あんぱん饅頭',
     category: '焼きまんじゅう',
     price: 250,
     size: '7x6.5',
     description: '北海道小豆を炊いて作る自慢のつぶ餡を、もちもち食感の生地でやさしく包みました。小さなお子様から年配の方まで幅広く好まれる味わいの、あんぱんのようなお饅頭です。',
     allergyInfo: '卵,小麦,乳',
     calories: 132,
     beforeImagePath: '/images/wagashi/n_anpanmanju.jpg',
     afterImagePath: '/images/wagashi/s_anpanmanju1.jpg',
     ingredients: '砂糖（国内製造）、小豆、卵、小麦粉、マーガリン（乳成分・大豆を含む）、水飴、澱粉、脱脂粉乳、ぶどう糖、植物油脂、寒天、麦芽糖、食塩、卵黄粉末/トレハロース、加工澱粉、膨張剤、増粘多糖類、香料',
     nutritionInfo: '1個平均36ｇあたり  エネルギー132kcal、たんぱく質2.3ｇ、脂質3.0ｇ、炭水化物24.0ｇ、食塩相当量0.15ｇ',
     shelfLife: '出荷日を含め30日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
   {
     id: 'test-product-012', 
     name: 'あんぱん饅頭３入',
     category: '焼きまんじゅう',
     price: 750,
     size: '7x21',
     description: '北海道小豆を炊いて作る自慢のつぶ餡を、もちもち食感の生地でやさしく包みました。小さなお子様から年配の方まで幅広く好まれる味わいの、あんぱんのようなお饅頭です。',
     allergyInfo: '卵,小麦,乳',
     calories: 132,
     beforeImagePath: '/images/wagashi/n_anpanmanju.jpg',
     afterImagePath: '/images/wagashi/s_anpanmanju3.jpg',
     ingredients: '砂糖（国内製造）、小豆、卵、小麦粉、マーガリン（乳成分・大豆を含む）、水飴、澱粉、脱脂粉乳、ぶどう糖、植物油脂、寒天、麦芽糖、食塩、卵黄粉末/トレハロース、加工澱粉、膨張剤、増粘多糖類、香料',
     nutritionInfo: '1個平均36ｇあたり  エネルギー132kcal、たんぱく質2.3ｇ、脂質3.0ｇ、炭水化物24.0ｇ、食塩相当量0.15ｇ',
     shelfLife: '出荷日を含め30日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
   {
     id: 'test-product-013', 
     name: 'やまかつら３入',
     category: '餡もの',
     price: 700,
     size: '8x10.5',
     description: '小豆の皮むき餡を使った東雲づくりの餡の上に、黒糖羊羹を流し、薄緑色に染めた餡そぼろ（叢雨生地）の３層仕立ての和菓子。上品なくちどけ、やさしい甘さが特徴で、お茶会の主菓子としてもお使いいただける和菓子です。',
     allergyInfo: '該当無し',
     calories: 102,
     beforeImagePath: '/images/wagashi/n_yamakatsura.png',
     afterImagePath: '/images/wagashi/s_yamakatura.jpg',
     ingredients: '砂糖（国内製造）、小豆、手芒豆、米粉、水飴、黒糖、寒天、食塩、麦芽糖/トレハロース、膨張剤、着色料（黄４、黄５、青１）',
     nutritionInfo: '1個平均38ｇあたり  エネルギー102kcal、たんぱく質2.4g、脂質0.2g、炭水化物23.1g、食塩相当量0.04g',
     shelfLife: '出荷日を含め40日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
 {
     id: 'test-product-014', 
     name: 'やまかつら６入',
     category: '餡もの',
     price: 1400,
     size: '8x21',
     description: '小豆の皮むき餡を使った東雲づくりの餡の上に、黒糖羊羹を流し、薄緑色に染めた餡そぼろ（叢雨生地）の３層仕立ての和菓子。上品なくちどけ、やさしい甘さが特徴で、お茶会の主菓子としてもお使いいただける和菓子です。',
     allergyInfo: '該当無し',
     calories: 102,
     beforeImagePath: '/images/wagashi/n_yamakatsura.png',
     afterImagePath: '/images/wagashi/s_yamakatura2.jpg',
     ingredients: '砂糖（国内製造）、小豆、手芒豆、米粉、水飴、黒糖、寒天、食塩、麦芽糖/トレハロース、膨張剤、着色料（黄４、黄５、青１）',
     nutritionInfo: '1個平均38ｇあたり  エネルギー102kcal、たんぱく質2.4g、脂質0.2g、炭水化物23.1g、食塩相当量0.04g',
     shelfLife: '出荷日を含め40日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
 {
     id: 'test-product-015', 
     name: 'だんだん 抹茶 １個',
     category: '焼きまんじゅう',
     price: 220,
     size: '11.2x5.2',
     description: '「だんだん」は「ありがとう」という意味の出雲地方の言葉です。しっとりした生地、食べやすい大きさに作りました。感謝の気持ちを伝えるときにぴったりのお菓子です。',
     allergyInfo: '乳,小麦,卵',
     calories: 90,
     beforeImagePath: '/images/wagashi/n_dandan_mattya.png',
     afterImagePath: '/images/wagashi/s_dandan_mattya.jpg',
     ingredients: '砂糖（国内製造）、手芒豆、小麦粉、水飴、加糖練乳、卵、バター、生クリーム、チョコレート（大豆を含む）、蜂蜜、抹茶/トレハロース、膨張剤、乳化剤、香料',
     nutritionInfo: '1個平均30ｇあたり  エネルギー90kcal、たんぱく質1.6g、脂質2.1g、炭水化物16.2g、食塩相当量0.05g ',
     shelfLife: '出荷日を含め20日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
 {
     id: 'test-product-016', 
     name: 'だんだん チョコ １個',
     category: '焼きまんじゅう',
     price: 220,
     size: '11.2x5.2',
     description: '「だんだん」は「ありがとう」という意味の出雲地方の言葉です。しっとりした生地、食べやすい大きさに作りました。感謝の気持ちを伝えるときにぴったりのお菓子です。',
     allergyInfo: '乳,小麦,卵',
     calories: 109,
     beforeImagePath: '/images/wagashi/n_dandan_chocolate.png',
     afterImagePath: '/images/wagashi/s_dandan_chocolate.jpg',
     ingredients: '砂糖（国内製造）、手芒豆、チョコレート（大豆を含む）、生クリーム、小麦粉、加糖練乳、卵、バター、ココアパウダー、水飴、蜂蜜/トレハロース、膨張剤、乳化剤、香料',
     nutritionInfo: '1個平均30ｇあたり  エネルギー109kcal、たんぱく質1.9g、脂質4g、炭水化物17g、食塩相当量0.05g',
     shelfLife: '出荷日を含め20日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
 {
     id: 'test-product-017', 
     name: 'だんだん４入',
     category: '焼きまんじゅう',
     price: 880,
     size: '11.2x21',
     description: '「だんだん」は「ありがとう」という意味の出雲地方の言葉です。しっとりした生地、食べやすい大きさに作りました。感謝の気持ちを伝えるときにぴったりのお菓子です。',
     allergyInfo: '乳,小麦,卵',
     calories: 0,
     beforeImagePath: '/images/wagashi/n_dandan.jpg',
     afterImagePath: '/images/wagashi/s_dandan4.jpg',
     ingredients: '【抹茶】砂糖（国内製造）、手芒豆、小麦粉、水飴、加糖練乳、卵、バター、生クリーム、チョコレート（大豆を含む）、蜂蜜、抹茶/トレハロース、膨張剤、乳化剤、香料【チョコ】砂糖（国内製造）、手芒豆、チョコレート（大豆を含む）、生クリーム、小麦粉、加糖練乳、卵、バター、ココアパウダー、水飴、蜂蜜/トレハロース、膨張剤、乳化剤、香料',
     nutritionInfo: '【抹茶】1個平均30ｇあたり エネルギー90kcal、たんぱく質1.6g、脂質2.1g、炭水化物16.2g、食塩相当量0.05g【チョコ】1個平均30ｇあたり エネルギー109kcal、たんぱく質1.9g、脂質4g、炭水化物17g、食塩相当量0.05g',
     shelfLife: '出荷日を含め20日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
 {
     id: 'test-product-018', 
     name: '朝汐４入',
     category: 'まんじゅう',
     price: 900,
     size: '5.5x21',
     description: '「朝汐」は日本海の荒波が岩にぶつかることで出来る泡の風景をお菓子に表したお饅頭です。ほんのり塩味が効いた上品な甘さの餡と、つくね芋を使用して作るしっとりとした口当たりの生地が特徴です。',
     allergyInfo: '該当無し',
     calories: 117,
     beforeImagePath: '/images/wagashi/n_asasio.jpg',
     afterImagePath: '/images/wagashi/s_asasio.png',
     ingredients: '砂糖（国内製造）、つくね芋ペースト（砂糖、山芋）、小豆、米粉、還元水飴、食塩/トレハロース',
     nutritionInfo: '1個平均42ｇあたり エネルギー117kcal、たんぱく質2.3g、脂質0.2g、炭水化物27.2g、食塩相当量0.05g',
     shelfLife: '出荷日を含め15日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
 {
     id: 'test-product-019', 
     name: '蕎麦じょうよう４入',
     category: 'まんじゅう',
     price: 900,
     size: '5.5x21',
     description: '熟練の職人が丁寧に炊きあげた滑らかなこし餡を蕎麦粉をまぜた薯蕷生地で包み、蒸しあげました。ローストした蕎麦の実も乗っています。口の中で広がる蕎麦の香りと、上品な小豆の風味が楽しめるロングセラー商品です。',
     allergyInfo: 'そば',
     calories: 121,
     beforeImagePath: '/images/wagashi/n_sobajouyou.png',
     afterImagePath: '/images/wagashi/s_sobajouyou.png',
     ingredients: '小豆（国産）、つくね芋ペースト（砂糖、山芋）、砂糖、米粉、そばの実、還元水飴、そば粉/トレハロース',
     nutritionInfo: '1個平均42ｇあたり エネルギー121kcal、たんぱく質2.6g、脂質0.3g、炭水化物27.7g、食塩相当量0g',
     shelfLife: '出荷日を含め15日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
{
     id: 'test-product-020', 
     name: '柚子じょうよう４入',
     category: '季節限定',
     price: 1000,
     size: '5.5x21',
     description: '国産柚子をつくね芋の生地に練り込み、こし餡を包んだ冬季限定の薯蕷饅頭です。つくね芋の生地のしっとりと上品な口当たりと、こし餡と柚子の風味をお楽しみください。',
     allergyInfo: '概要無し',
     calories: 142,
     beforeImagePath: '/images/wagashi/n_yuzujouyou.png',
     afterImagePath: '/images/wagashi/s_yuzujouyou.png',
     ingredients: '砂糖（国内製造）、小豆、つくね芋ペースト（砂糖、山芋）、米粉、還元水飴、手芒豆、柚子ペースト、水飴、寒天、麦芽糖/トレハロース、着色料（赤３、赤１０６、黄４、黄５、青１）',
     nutritionInfo: '1個平均42ｇあたり エネルギー142kcal、たんぱく質2.7g、脂質0.3g、炭水化物32.3g、食塩相当量0g',
     shelfLife: '出荷日を含め15日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
{
     id: 'test-product-021', 
     name: '彩文',
     category: '干菓子',
     price: 500,
     size: '8x15',
     description: 'お抹茶、煎茶をはじめ紅茶、珈琲にもよく合い、ブランデー、ウイスキーの水割りなどのおつまみにも適した新しいタイプの和菓子です。求肥とうずら豆の餡を重ね、紫は白ごま、 黄は柚子の香りをそえました。',
     allergyInfo: '概要無し',
     calories: 0,
     beforeImagePath: '/images/wagashi/n_saimon.png',
     afterImagePath: '/images/wagashi/s_saimon.jpg',
     ingredients: '【胡麻】砂糖（国内製造）、鶉豆、米粉、水飴、砂糖結合水飴、胡麻、澱粉/酵素、増粘多糖類、着色料（赤３、赤１０６、黄５、青１）【柚子】砂糖（国内製造）、鶉豆、米粉、水飴、柚子ペースト、砂糖結合水飴、澱粉/酵素、増粘多糖類、着色料（赤３、赤１０６、黄４、黄５）',
     nutritionInfo: '【胡麻】1本平均9ｇ あたりエネルギー30kcal、たんぱく質0.5g、脂質0.1g、炭水化物6.9g、食塩相当量0g【柚子】1本平均9ｇあたり エネルギー30kcal、たんぱく質0.4g、脂質0g、炭水化物6.9g、食塩相当量0g ',
     shelfLife: '出荷日を含め20日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
{
     id: 'test-product-022', 
     name: '彩文２袋',
     category: '干菓子',
     price: 1000,
     size: '8x21',
     description: 'お抹茶、煎茶をはじめ紅茶、珈琲にもよく合い、ブランデー、ウイスキーの水割りなどのおつまみにも適した新しいタイプの和菓子です。求肥とうずら豆の餡を重ね、紫は白ごま、 黄は柚子の香りをそえました。',
     allergyInfo: '概要無し',
     calories: 0,
     beforeImagePath: '/images/wagashi/n_saimon.png',
     afterImagePath: '/images/wagashi/s_saimon2.jpg',
     ingredients: '【胡麻】砂糖（国内製造）、鶉豆、米粉、水飴、砂糖結合水飴、胡麻、澱粉/酵素、増粘多糖類、着色料（赤３、赤１０６、黄５、青１）【柚子】砂糖（国内製造）、鶉豆、米粉、水飴、柚子ペースト、砂糖結合水飴、澱粉/酵素、増粘多糖類、着色料（赤３、赤１０６、黄４、黄５）',
     nutritionInfo: '【胡麻】1本平均9ｇあたり エネルギー30kcal、たんぱく質0.5g、脂質0.1g、炭水化物6.9g、食塩相当量0g【柚子】1本平均9ｇあたり エネルギー30kcal、たんぱく質0.4g、脂質0g、炭水化物6.9g、食塩相当量0g ',
     shelfLife: '出荷日を含め20日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
{
     id: 'test-product-023', 
     name: '彩雲ようかん　抹茶',
     category: '羊羹',
     price: 230,
     size: '5.5x5.2',
     description: '島根県三瓶山の天然水を用い、なめらかな口当たりに仕上げました。日持ちもよく、食べやすいサイズの羊羹です。',
     allergyInfo: '概要無し',
     calories: 142,
     beforeImagePath: '/images/wagashi/n_saiunyoukan_mattya.png',
     afterImagePath: '/images/wagashi/s_saiunyoukan_mattya.jpg',
     ingredients: '砂糖（国内製造）、手芒豆、小豆、還元水飴、寒天、抹茶/トレハロース',
     nutritionInfo: '1個平均52ｇあたり 熱量142kcal、たんぱく質2.6ｇ、脂質0.3ｇ、炭水化物33.8ｇ、食塩相当量0.01ｇ',
     shelfLife: '出荷日を含め30日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
{
     id: 'test-product-024', 
     name: '彩雲ようかん　小倉',
     category: '羊羹',
     price: 230,
     size: '5.5x5.2',
     description: '島根県三瓶山の天然水を用い、なめらかな口当たりに仕上げました。日持ちもよく、食べやすいサイズの羊羹です。',
     allergyInfo: '概要無し',
     calories: 163,
     beforeImagePath: '/images/wagashi/n_saiunyoukan_ogura.png',
     afterImagePath: '/images/wagashi/s_saiunyoukan_ogura.jpg',
     ingredients: '砂糖（国内製造）、小豆、寒天、食塩',
     nutritionInfo: '1個平均52ｇあたり 熱量163kcal、たんぱく質2.2ｇ、脂質0.2ｇ、炭水化物39.2ｇ、食塩相当量0.05ｇ',
     shelfLife: '出荷日を含め30日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
{
     id: 'test-product-025', 
     name: '彩雲ようかん　柚子',
     category: '羊羹',
     price: 230,
     size: '5.5x5.2',
     description: '島根県三瓶山の天然水を用い、なめらかな口当たりに仕上げました。日持ちもよく、食べやすいサイズの羊羹です。',
     allergyInfo: '概要無し',
     calories: 124,
     beforeImagePath: '/images/wagashi/n_saiunyoukan_yuzu.png',
     afterImagePath: '/images/wagashi/s_saiunyoukan_yuzu.jpg',
     ingredients: '砂糖（国内製造）、手芒豆、還元水飴、寒天、柚子ペースト',
     nutritionInfo: '1個平均52ｇあたり 熱量124kcal、たんぱく質1.3ｇ、脂質0.1ｇ、炭水化物30.5g、食塩相当量0.01ｇ',
     shelfLife: '出荷日を含め30日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
{
     id: 'test-product-026', 
     name: '彩雲ようかん４入',
     category: '羊羹',
     price: 920,
     size: '5.5x21',
     description: '島根県三瓶山の天然水を用い、なめらかな口当たりに仕上げました。日持ちもよく、食べやすいサイズの羊羹です。',
     allergyInfo: '該当無し',
     calories: 0,
     beforeImagePath: '/images/wagashi/n_saiunyoukan4.png',
     afterImagePath: '/images/wagashi/s_saiunyoukan4.jpg',
     ingredients: '【小倉】砂糖（国内製造）、小豆、寒天、食塩【抹茶】砂糖（国内製造）、手芒豆、小豆、還元水飴、寒天、抹茶/トレハロース【柚子】砂糖（国内製造）、手芒豆、還元水飴、寒天、柚子ペースト ',
     nutritionInfo: '【小倉】1個平均52ｇあたり 熱量163kcal、たんぱく質2.2ｇ、脂質0.2ｇ、炭水化物39.2ｇ、食塩相当量0.05ｇ【抹茶】1個平均52ｇあたり 熱量142kcal、たんぱく質2.6ｇ、脂質0.3ｇ、炭水化物33.8ｇ、食塩相当量0.01ｇ【柚子】1個平均52ｇあたり 熱量124kcal、たんぱく質1.3ｇ、脂質0.1ｇ、炭水化物30.5ｇ、食塩相当量0.01ｇ',
     shelfLife: '出荷日を含め30日以上',
     storageMethod: '直射日光・高温多湿を避けて保存してください。また、開封後は、お早めにお召し上がりください。'
   },
 {
     id: 'test-product-027',
     name: '栗まる',
     category: '季節限定',
     price: 400,
     size: '7x7',
     description: '上品な甘さの栗そのものの風味を生かした人気の和菓子。蜜漬けした大粒の栗を「つぶ餡」と「こなし餡」の２種類の餡で包みました。ほっくりとした栗の味わいとつぶ餡の風味が広がります。秋から冬の季節限定の味わいをぜひご賞味ください。',
     allergyInfo: '小麦',
     calories: 170,
     beforeImagePath: '/images/wagashi/n_kurimaru.jpg',
     afterImagePath: '/images/wagashi/s_kurimaru1.jpg',
     ingredients: '砂糖(国内製造)、栗甘露煮、小豆、手芒豆、小麦粉、砂糖結合水飴、米粉、食塩、寒天、麦芽糖/トレハロース、酸化防止剤（Ｖ．Ｃ）、クチナシ色素',
     nutritionInfo: '1個平均45ｇあたり エネルギー170kcal、たんぱく質3.4g、脂質0.4g、炭水化物38.2g、食塩相当量0.03g',
     shelfLife: '出荷日を含め30日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
  {
     id: 'test-product-028',
     name: '栗まる ３入',
     category: '季節限定',
     price: 1200,
     size: '7x21',
     description: '上品な甘さの栗そのものの風味を生かした人気の和菓子。蜜漬けした大粒の栗を「つぶ餡」と「こなし餡」の２種類の餡で包みました。ほっくりとした栗の味わいとつぶ餡の風味が広がります。秋から冬の季節限定の味わいをぜひご賞味ください。',
     allergyInfo: '小麦',
     calories: 170,
     beforeImagePath: '/images/wagashi/n_kurimaru.jpg',
     afterImagePath: '/images/wagashi/s_kurimaru3.png',
     ingredients: '砂糖(国内製造)、栗甘露煮、小豆、手芒豆、小麦粉、砂糖結合水飴、米粉、食塩、寒天、麦芽糖/トレハロース、酸化防止剤（Ｖ．Ｃ）、クチナシ色素',
     nutritionInfo: '1個平均45ｇあたり エネルギー170kcal、たんぱく質3.4g、脂質0.4g、炭水化物38.2g、食塩相当量0.03g',
     shelfLife: '出荷日を含め30日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
    {
     id: 'test-product-029',
     name: 'くず湯 白',
     category: '季節限定',
     price: 170,
     size: '4.0x5.0',
     description: 'くず湯',
     allergyInfo: '小麦',
     calories: 150,
     beforeImagePath: '/images/wagashi/n_kuzuyu_siro.jpg',
     afterImagePath: '/images/wagashi/n_kuzuyu_siro.jpg',
     ingredients: '砂糖(国内製造)、馬鈴薯でん粉、葛粉、もち米（国産）、寒天、水飴、食塩 /着色料（コチニール、赤3)',
     nutritionInfo: '1個平均45ｇあたり エネルギー170kcal、たんぱく質3.4g、脂質0.4g、炭水化物38.2g、食塩相当量0.03g',
     shelfLife: '出荷日を含め60-90日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
 {
     id: 'test-product-030',
     name: 'くず湯 汁粉',
     category: '季節限定',
     price: 170,
     size: '4.0x5.0',
     description: 'くず湯',
     allergyInfo: '該当無し',
     calories: 150,
     beforeImagePath: '/images/wagashi/n_kuzuyu_ogura.jpg',
     afterImagePath: '/images/wagashi/n_kuzuyu_ogura.jpg',
     ingredients: '砂糖（国内製造)、馬鈴薯でん粉、抹茶（緑茶：国産）、葛粉、もち米（国産）、寒天、水飴、食塩 /着色料（クチナシ、黄4、黄5、青1、青2）',
     nutritionInfo: '1個平均45ｇあたり エネルギー170kcal、たんぱく質3.4g、脂質0.4g、炭水化物38.2g、食塩相当量0.03g',
     shelfLife: '出荷日を含め60-90日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
{
     id: 'test-product-031',
     name: 'くず湯 抹茶',
     category: '季節限定',
     price: 170,
     size: '4.0x5.0',
     description: 'くず湯',
     allergyInfo: '該当無し',
     calories: 150,
     beforeImagePath: '/images/wagashi/n_kuzuyu_mattya.jpg',
     afterImagePath: '/images/wagashi/n_kuzuyu_mattya.jpg',
     ingredients: '砂糖（国内製造)、馬鈴薯でん粉、小豆晒し餡、葛粉、もち米（国産）、寒天、水飴、食塩 /着色料（コチニール、赤3）',
     nutritionInfo: '1個平均45ｇあたり エネルギー170kcal、たんぱく質3.4g、脂質0.4g、炭水化物38.2g、食塩相当量0.03g',
     shelfLife: '出荷日を含め60-90日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
{
     id: 'test-product-032',
     name: 'くず湯４個',
     category: '季節限定',
     price: 680,
     size: '3.3x21',
     description: 'くず湯',
     allergyInfo: '該当無し',
     calories: 170,
     beforeImagePath: '/images/wagashi/s_kuzuyu4.jpg',
     afterImagePath: '/images/wagashi/s_kuzuyu4.jpg',
     ingredients: '砂糖(国内製造)、栗甘露煮、小豆、手芒豆、小麦粉、砂糖結合水飴、米粉、食塩、寒天、麦芽糖/トレハロース、酸化防止剤（Ｖ．Ｃ）、クチナシ色素',
     nutritionInfo: '1個平均45ｇあたり エネルギー170kcal、たんぱく質3.4g、脂質0.4g、炭水化物38.2g、食塩相当量0.03g',
     shelfLife: '出荷日を含め30日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
{
     id: 'test-product-033',
     name: '初空',
     category: '季節限定',
     price: 1800,
     size: '5.5x21',
     description: '山の稜線から昇る初日の出を写した冬の棹菓子です。小豆羊羹と半錦玉の羊羹を合わせて風味良く仕上げました。',
     allergyInfo: '該当無し',
     calories: 1176,
     beforeImagePath: '/images/wagashi/n_hatuzora.png',
     afterImagePath: '/images/wagashi/s_hatuzora.jpg',
     ingredients: '砂糖（国内製造）、手芒豆、水飴、小豆、寒天/着色料（赤３、赤１０６、黄４、黄５、青1、金箔',
     nutritionInfo: '1本平均400gあたり エネルギー1,176kcal、たんぱく質11.4g、脂質1.0g、炭水化物286.2g、食塩相当量0.04g',
     shelfLife: '出荷日を含め30日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
{
     id: 'test-product-034',
     name: '初空ミニ',
     category: '季節限定',
     price: 1000,
     size: '5.7x10.8',
     description: '山の稜線から昇る初日の出を写した冬の棹菓子です。小豆羊羹と半錦玉の羊羹を合わせて風味良く仕上げました。',
     allergyInfo: '該当無し',
     calories: 1176,
     beforeImagePath: '/images/wagashi/n_hatuzora.png',
     afterImagePath: '/images/wagashi/s_hatuzoramini.jpg',
     ingredients: '砂糖（国内製造）、手芒豆、水飴、小豆、寒天/着色料（赤３、赤１０６、黄４、黄５、青1、金箔',
     nutritionInfo: '1本平均400gあたり エネルギー1,176kcal、たんぱく質11.4g、脂質1.0g、炭水化物286.2g、食塩相当量0.04g',
     shelfLife: '出荷日を含め30日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
{
     id: 'test-product-035',
     name: '花びら餅',
     category: '季節限定',
     price: 350,
     size: '11.2x5.2',
     description: '花びら餅は茶道・裏千家の初釜に用いられる、新年を寿ぐおめでたい和菓子です。柔らかい求肥の食感と、薄紅色に染めた白味噌のほのかな香りが新年を迎える喜びをより深く感じさせてくれます。',
     allergyInfo: '卵',
     calories: 178,
     beforeImagePath: '/images/wagashi/n_hanabiramochi.jpg',
     afterImagePath: '/images/wagashi/s_hanabiramochi.png',
     ingredients: '砂糖（国内製造）、米粉、ごぼう甘露煮、麦芽糖、手芒豆、水飴、白味噌（大豆を含む）、卵白（卵を含む）、砂糖結合水飴、澱粉/トレハロース、酵素、着色料（赤3、赤106、黄5）',
     nutritionInfo: '1個平均58ｇあたり エネルギー178kcal、たんぱく質1.8g、脂質0.2g、炭水化物42.1g、食塩相当量0.09g',
     shelfLife: '出荷日を含め10日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
{
     id: 'test-product-036',
     name: '花びら餅',
     category: '季節限定',
     price: 1750,
     size: '11.2x21',
     description: '花びら餅は茶道・裏千家の初釜に用いられる、新年を寿ぐおめでたい和菓子です。柔らかい求肥の食感と、薄紅色に染めた白味噌のほのかな香りが新年を迎える喜びをより深く感じさせてくれます。',
     allergyInfo: '卵',
     calories: 178,
     beforeImagePath: '/images/wagashi/n_hanabiramochi.jpg',
     afterImagePath: '/images/wagashi/s_hanabiramochi5.png',
     ingredients: '砂糖（国内製造）、米粉、ごぼう甘露煮、麦芽糖、手芒豆、水飴、白味噌（大豆を含む）、卵白（卵を含む）、砂糖結合水飴、澱粉/トレハロース、酵素、着色料（赤3、赤106、黄5）',
     nutritionInfo: '1個平均58ｇあたり エネルギー178kcal、たんぱく質1.8g、脂質0.2g、炭水化物42.1g、食塩相当量0.09g',
     shelfLife: '出荷日を含め10日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。'
   },
   {
     id: 'test-product-037',
     name: '大福',
     category: '餡もの',
     price: 200,
     size: '4.6x3.1',
     description: '島根県産のもち米を使用した柔らかいお餅で、北海道産小豆を使った甘さ控えめのこし餡を包みました。シンプルながらも素材の良さが引き立つ定番の和菓子です。',
     allergyInfo: '小麦、大豆、乳、卵',
     calories: 102,
     beforeImagePath: '/images/wagashi/daifuku_1.png',
     afterImagePath: '/images/wagashi/daifuku_2.png',
     ingredients: '砂糖（国内製造）、餅米（島根県産）、小豆（北海道産）、水飴、還元水飴、食塩、トレハロース、加工澱粉、酵素、乳化剤、（一部に小麦・大豆・乳成分・卵を含む）',
     nutritionInfo: '1個平均45ｇ当たり　エネルギー: 102kcal、たんぱく質: 0.5g、脂質: 0.1g、炭水化物: 24.8g、食塩相当量0g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-038',
     name: 'どらやき',
     category: '焼き菓子',
     price: 320,
     size: '4.7x3.2',
     description: 'ふんわりと焼き上げた生地で、北海道産小豆を使った甘さ控えめのこし餡を挟みました。素材の良さが引き立つ定番の和菓子です。',
     allergyInfo: '卵、小麦',
     calories: 200,
     beforeImagePath: '/images/wagashi/dorayaki_1.png',
     afterImagePath: '/images/wagashi/dorayaki_2.png',
     ingredients: '砂糖（国内製造）、小豆（北海道産）、卵、還元水飴、蜂蜜、米粉、麦芽糖、植物油脂、食塩、トレハロース、膨張剤、加工澱粉、酵素、（一部に卵・小麦を含む）',
     nutritionInfo: '1個平均70ｇ当たり　エネルギー: 200kcal、たんぱく質: 4.3g、脂質: 1.2g、炭水化物: 44.5g、食塩相当量0.2g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-039',
     name: 'かりんとう',
     category: '季節限定',
     price: 500,
     size: '9.4x6.4',
     description: '国産小麦を使用した生地をカリッと揚げ、黒糖蜜で仕上げた昔ながらのかりんとうです。お茶請けやおやつにぴったりの和菓子です。',
     allergyInfo: '小麦',
     calories: 450,
     beforeImagePath: '/images/wagashi/karintou_1.png',
     afterImagePath: '/images/wagashi/karintou_2.png',
     ingredients: '小麦粉（国産）、砂糖、黒糖、水飴、植物油脂、食塩、膨張剤、（一部に小麦を含む）',
     nutritionInfo: '100g当たり　エネルギー: 450kcal、たんぱく質: 5.0g、脂質: 15.0g、炭水化物: 75.0g、食塩相当量0.5g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-040',
     name: 'カステラ',
     category: ' 焼き菓子',
     price: 600,
     size: '7.0x4.8',
     description: 'しっとりと焼き上げたカステラ生地に、北海道産小豆を使った甘さ控えめのこし餡を巻き込みました。素材の良さが引き立つ定番の和菓子です。',
     allergyInfo: '卵、小麦',
     calories: 320,
     beforeImagePath: '/images/wagashi/kasutera_1.png',
     afterImagePath: '/images/wagashi/kasutera_2.png',
     ingredients: '砂糖（国内製造）、小豆（北海道産）、卵、還元水飴、蜂蜜、小麦粉、米粉、植物油脂、食塩、トレハロース、膨張剤、加工澱粉、酵素、（一部に卵・小麦を含む）',
     nutritionInfo: '1個平均100ｇ当たり　エネルギー: 320kcal、たんぱく質: 6.0g、脂質: 5.0g、炭水化物: 60.0g、食塩相当量0.3g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-041',
     name: '栗饅頭',
     category: '餡もの',
     price: 650,
     size: '8x8',
     description: '国産栗をふんだんに使用した栗饅頭です。素材の良さが引き立つ定番の和菓子です。',
     allergyInfo: '小麦',
     calories: 450,
     beforeImagePath: '/images/wagashi/kurimannjuu_1.png',
     afterImagePath: '/images/wagashi/kurimannjuu_2.png',
     ingredients: '砂糖（国内製造）、栗（国産）、小麦粉、手芒豆、水飴、砂糖結合水飴、米粉、食塩、トレハロース、加工澱粉、酵素、（一部に小麦を含む）',
     nutritionInfo: '1個平均100ｇ当たり　エネルギー: 450kcal、たんぱく質: 6.0g、脂質: 1.0g、炭水化物: 98.0g、食塩相当量0.2g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-042',
     name: '草餅',
     category: '餡もの',
     price: 360,
     size: '6.9x4.6',
     description: '国産よもぎを練り込んだ風味豊かな草餅で、北海道産小豆を使った甘さ控えめのこし餡を包みました。素材の良さが引き立つ定番の和菓子です。',
     allergyInfo: '小麦、大豆',
     calories: 180,
     beforeImagePath: '/images/wagashi/kusamochi_1.png',
     afterImagePath: '/images/wagashi/kusamochi_2.png',
     ingredients: '砂糖（国内製造）、餅米（国産）、小豆（北海道産）、よもぎ（国産）、水飴、還元水飴、食塩、トレハロース、加工澱粉、酵素、（一部に小麦・大豆を含む）',
     nutritionInfo: '100g当たり　エネルギー: 180kcal、たんぱく質: 2.0g、脂質: 0.5g、炭水化物: 45.0g、食塩相当量0.1g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-043',
     name: 'みたらし団子',
     category: '餡もの',
     price: 300,
     size: '10.2x15.3',
     description: 'もちもちとした食感の団子に、甘辛いみたらしタレを絡めました。お茶請けやおやつにぴったりの和菓子です。',
     allergyInfo: '小麦、大豆',
     calories: 800,
     beforeImagePath: '/images/wagashi/mitarashi-dango_1.png',
     afterImagePath: '/images/wagashi/mitarashi-dango_2.png',
     ingredients: '砂糖（国内製造）、餅米（国産）、醤油（大豆・小麦を含む）、水飴、還元水飴、みりん、食塩、トレハロース、加工澱粉、酵素、（一部に小麦・大豆を含む）',
     nutritionInfo: '100g当たり　エネルギー: 800kcal、たんぱく質: 5.0g、脂質: 1.0g、炭水化物: 180.0g、食塩相当量0.8g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-044',
     name: 'もなか',
     category: '餡もの',
     price: 250,
     size: '5.6x3.8',
     description: 'パリッと香ばしい最中の皮で、北海道産小豆を使った甘さ控えめのこし餡を挟みました。素材の良さが引き立つ定番の和菓子です。',
     allergyInfo: '小麦',
     calories: 150,
     beforeImagePath: '/images/wagashi/monaka_1.png',
     afterImagePath: '/images/wagashi/monaka_2.png',
     ingredients: '砂糖（国内製造）、小豆（北海道産）、最中種（小麦を含む）、水飴、還元水飴、食塩、トレハロース、加工澱粉、酵素、（一部に小麦を含む）',
     nutritionInfo: '100g当たり　エネルギー: 150kcal、たんぱく質: 3.0g、脂質: 1.0g、炭水化物: 35.0g、食塩相当量0.2g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-045',
     name: '桜餅',
     category: '餡もの',
     price: 300,
     size: '4.7x3.1',
     description: '国産桜葉を使用した風味豊かな桜餅で、北海道産小豆を使った甘さ控えめのこし餡を包みました。素材の良さが引き立つ定番の和菓子です。',
     allergyInfo: '小麦、大豆',
     calories: 250,
     beforeImagePath: '/images/wagashi/sakuramochi_1.png',
     afterImagePath: '/images/wagashi/sakuramochi_2.png',
     ingredients: '砂糖（国内製造）、餅米（国産）、小豆（北海道産）、桜葉（国産）、水飴、還元水飴、食塩、トレハロース、加工澱粉、酵素、（一部に小麦・大豆を含む）',
     nutritionInfo: '100g当たり　エネルギー: 250kcal、たんぱく質: 3.0g、脂質: 1.0g、炭水化物: 55.0g、食塩相当量0.2g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
    {
     id: 'test-product-046',
     name: 'せんべい',
     category: '干菓子',
     price: 400,
     size: '8.4x5.7',
     description: '国産米を使用した香ばしいせんべいです。お茶請けやおやつにぴったりの和菓子です。',
     allergyInfo: '小麦',
     calories: 350,
     beforeImagePath: '/images/wagashi/senbei_1.png',
     afterImagePath: '/images/wagashi/senbei_2.png',
     ingredients: '米（国産）、砂糖、醤油（大豆・小麦を含む）、植物油脂、食塩、膨張剤、（一部に小麦・大豆を含む）',
     nutritionInfo: '100g当たり　エネルギー: 350kcal、たんぱく質: 5.0g、脂質: 12.0g、炭水化物: 65.0g、食塩相当量0.4g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   },
   {
     id: 'test-product-047',
     name: '羊羹',
     category: '餡もの',
     price: 700,
     size: '9.4x6.2',
     description: '国産小豆を使用した香ばしい羊羹です。お茶請けやおやつにぴったりの和菓子です。',
     allergyInfo: '小麦',
     calories: 350,
     beforeImagePath: '/images/wagashi/youkan_1.png',
     afterImagePath: '/images/wagashi/youkan_2.png',
     ingredients: '砂糖（国内製造）、小豆（国産）、寒天、食塩、（一部に小麦を含む）',
     nutritionInfo: '100g当たり　エネルギー: 350kcal、たんぱく質: 5.0g、脂質: 1.0g、炭水化物: 80.0g、食塩相当量0.2g',
     shelfLife: '出荷日を含め15日',
     storageMethod: '直射日光・高温多湿を避けて保存してください。 '
   }
  ]

  // 商品を作成（固定IDを使用）
  for (const product of productData) {
    try {
      const createdProduct = await prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          price: product.price,
          categoryId: getCategoryId(product.category),
          description: product.description,
          allergyInfo: product.allergyInfo,
          calories: product.calories,
          size: product.size,
          beforeImagePath: product.beforeImagePath,
          afterImagePath: product.afterImagePath,
          ingredients: product.ingredients,
          nutritionInfo: product.nutritionInfo,
          shelfLife: product.shelfLife,
          storageMethod: product.storageMethod
        },
        create: {
          companyId: company.id,
          id: product.id,
          name: product.name,
          price: product.price,
          categoryId: getCategoryId(product.category),
          description: product.description,
          allergyInfo: product.allergyInfo,
          calories: product.calories,
          size: product.size,
          beforeImagePath: product.beforeImagePath,
          afterImagePath: product.afterImagePath,
          ingredients: product.ingredients,
          nutritionInfo: product.nutritionInfo,
          shelfLife: product.shelfLife,
          storageMethod: product.storageMethod
        }
      })
      products.push(createdProduct)
      console.log(`✅ 商品を作成/更新しました: ${product.name} (ID: ${product.id})`)
    } catch (error) {
      console.log(`❌ 商品「${product.name}」の作成に失敗しました:`, error)
    }
  }

  // 既存の商品を取得
  const existingProducts = await prisma.product.findMany()
  const allProducts = products.length > 0 ? products : existingProducts

  // 店舗の作成
  const stores = []
  const storeData = [
    {
      id: 'test-store-001',
      name: '本店',
      description: '彩雲堂本店',
      address: '島根県松江市天神町124',
      phone: '0852-21-2727'
    },
    {
      id: 'test-store-002',
      name: '出雲店',
      description: '彩雲堂出雲店',
      address: '島根県出雲市姫原町',
      phone: '0853-23-0603'
    }
  ]

  for (const store of storeData) {
    try {
      const createdStore = await prisma.store.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: store.name,
          }
        },
        update: {
          name: store.name,
          description: store.description,
          address: store.address,
          phone: store.phone,
          isActive: true
        },
        create: {
          companyId: company.id,
          id: store.id,
          name: store.name,
          description: store.description,
          address: store.address,
          phone: store.phone,
          isActive: true
        }
      })
      stores.push(createdStore)
      console.log(`✅ 店舗を作成/更新しました: ${store.name} (ID: ${store.id})`)
    } catch (error) {
      console.log(`❌ 店舗「${store.name}」の作成に失敗しました:`, error)
    }
  }

  // 既存の店舗を取得
  const existingStores = await prisma.store.findMany()
  const allStores = stores.length > 0 ? stores : existingStores

  // 店舗別在庫の作成
  for (const store of allStores) {
    for (const product of allProducts) {
      try {
        await prisma.stock.upsert({
          where: { 
            companyId_productId_storeId: {
              companyId: company.id,
              productId: product.id,
              storeId: store.id
            }
          },
          update: {},
          create: {
            companyId: company.id,
            productId: product.id,
            storeId: store.id,
            quantity: Math.floor(Math.random() * 50) + 10 // 10-60個のランダム在庫
          }
        })
      } catch (error) {
        console.log(`ℹ️ 店舗「${store.name}」の商品「${product.name}」の在庫は既に存在します`)
      }
    }
    console.log(`✅ 店舗「${store.name}」の在庫を作成しました`)
  }

  console.log('🎉 シードデータの投入が完了しました！')
  console.log('📧 管理者ログイン情報:')
  console.log('   メール: admin@example.com')
  console.log('   パスワード: I9mJCaDrscR06kV')
}

main()
  .catch((e) => {
    console.error('❌ シードデータの投入に失敗しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 