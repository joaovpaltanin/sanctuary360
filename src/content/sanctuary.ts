export const elementIds = ['gate','altar','basin','table','lampstand','incense','veil','ark','christ'] as const;

export type ElementId = (typeof elementIds)[number];

export type Zone = 'Pátio' | 'Lugar Santo' | 'Lugar Santíssimo' | 'Síntese';

export interface SanctuaryElement {
  id: ElementId;
  number: string;
  name: string;
  subtitle: string;
  zone: Zone;
  description: string;
  materials: string[];
  dimensions: { label: string; cubits: number }[];
  references: { passage: string; summary: string }[];
  theology: string;
  theologyRefs: string[];
  reconstruction: string;
  certainty: 'Medidas bíblicas' | 'Reconstrução aproximada' | 'Síntese teológica';
}

export const editorialNotice =
  'Rascunho para revisão teológica humana, sem aprovação institucional. Conteúdo na perspectiva adventista do sétimo dia; referências acompanhadas de resumos autorais, não de citações de traduções bíblicas. Reconstrução esquemática do Tabernáculo do deserto. O tour é didático, não um ritual único: havia restrições de acesso sacerdotal. Publicação pública depende de revisão humana e verificação de direitos de uso.';

export const confessionalSource: { label: string; url: string } = {
  label: 'Fonte confessional adventista — Crença Fundamental 24: O ministério de Cristo no santuário celestial',
  url: 'https://www.adventist.org/beliefs/',
};

export const elements: SanctuaryElement[] = [
  {
    id: 'gate',
    number: '01',
    name: 'Entrada do pátio',
    subtitle: 'O início do percurso',
    zone: 'Pátio',
    description:
      'A entrada ficava no lado oriental do pátio e tinha uma cortina colorida sustentada por quatro colunas. Ela dava acesso à área externa do Tabernáculo, onde se apresentavam ofertas. Entrar no pátio não autorizava o adorador a circular pela tenda: o serviço interior tinha atribuições e limites sacerdotais.',
    materials: ['Linho fino retorcido', 'Fios azuis, púrpura e escarlate'],
    dimensions: [
      { label: 'Largura da cortina de entrada', cubits: 20 },
      { label: 'Altura da cortina, como as cortinas do pátio', cubits: 5 },
    ],
    references: [
      {
        passage: 'Êxodo 27:13–18; 38:18–19',
        summary: 'Resumo autoral: a entrada oriental tem uma cortina de vinte côvados e quatro colunas. Êxodo 27 informa a altura do pátio; Êxodo 38 explicita os cinco côvados da cortina de entrada.',
      },
      {
        passage: 'Levítico 1:3–5; Hebreus 9:6–7',
        summary: 'Resumo autoral: o ofertante apresenta sua oferta e os sacerdotes desempenham funções próprias; o acesso aos compartimentos interiores não é livre.',
      },
    ],
    theology:
      'Na leitura adventista aqui adotada, a entrada convida a pensar na aproximação de Deus por Cristo. João 10:9 apresenta Jesus como porta no contexto do pastor e das ovelhas, não como explicação arquitetônica desta cortina. A associação com a entrada do pátio é uma aplicação tipológica, não uma identificação expressa em Êxodo. Hebreus fundamenta a confiança em aproximar-se de Deus na obra de Jesus, sem transformar a visita virtual em rito de salvação.',
    theologyRefs: ['João 10:7–10', 'Hebreus 10:19–22'],
    reconstruction:
      'Representamos a entrada como cortina, não como portão de madeira de um templo posterior. A largura vem de Êxodo 27:16; a altura das cortinas do pátio aparece em 27:18 e a da entrada em 38:18. Dobras, tonalidades e espessuras são aproximações visuais. A abertura permanente serve apenas à navegação didática.',
    certainty: 'Medidas bíblicas',
  },
  {
    id: 'altar',
    number: '02',
    name: 'Altar do holocausto',
    subtitle: 'Ofertas no pátio',
    zone: 'Pátio',
    description:
      'O altar de madeira de acácia revestida de bronze era quadrado, oco e possuía chifres nos quatro cantos. No pátio, recebia ofertas queimadas segundo instruções específicas. Levítico distingue a participação do ofertante do trabalho sacerdotal com o sangue e o fogo; não descreve uma atividade indiferenciada de todos os visitantes.',
    materials: ['Madeira de acácia', 'Bronze'],
    dimensions: [
      { label: 'Comprimento', cubits: 5 },
      { label: 'Largura', cubits: 5 },
      { label: 'Altura', cubits: 3 },
    ],
    references: [
      {
        passage: 'Êxodo 27:1–8',
        summary: 'Resumo autoral: o altar mede cinco por cinco côvados e três de altura; tem revestimento de bronze, chifres, grelha, argolas e varais para transporte.',
      },
      {
        passage: 'Levítico 1:3–9',
        summary: 'Resumo autoral: as instruções para o holocausto do rebanho distinguem os atos do ofertante e as responsabilidades dos sacerdotes no altar.',
      },
    ],
    theology:
      'Na perspectiva adventista, o sistema de sacrifícios é lido à luz da entrega de Cristo. Hebreus contrasta ofertas repetidas, incapazes de remover definitivamente o pecado, com o sacrifício único e eficaz de Jesus. Essa conexão não exige atribuir um significado secreto a cada material do altar. A Crença Fundamental 24 distingue a oferta realizada uma vez por todas na cruz do ministério celestial de Cristo, que comunica seus benefícios, sem repetir sua morte.',
    theologyRefs: ['Hebreus 9:11–14, 24–28', 'Hebreus 10:1–14', confessionalSource.label],
    reconstruction:
      'As três medidas principais seguem Êxodo 27. O desenho dos chifres, a espessura das tábuas e o acabamento do bronze são esquemáticos; a disposição da grelha exige escolhas de interpretação visual. Eventuais brasas e fumaça apenas ilustram a função do altar, sem reconstituir um sacrifício específico nem acrescentar medidas bíblicas.',
    certainty: 'Medidas bíblicas',
  },
  {
    id: 'basin',
    number: '03',
    name: 'Bacia de bronze',
    subtitle: 'Lavagem para o serviço',
    zone: 'Pátio',
    description:
      'A bacia e sua base eram de bronze e ficavam entre a tenda e o altar. Arão e seus filhos lavavam mãos e pés antes do serviço, conforme a ordem recebida. Êxodo associa sua fabricação aos espelhos das mulheres que serviam à entrada, mas não fornece altura, diâmetro ou capacidade.',
    materials: ['Bronze da bacia e da base'],
    dimensions: [],
    references: [
      {
        passage: 'Êxodo 30:17–21',
        summary: 'Resumo autoral: a bacia com água fica entre a tenda e o altar; a lavagem de mãos e pés é exigida de Arão e seus filhos antes de ministrarem.',
      },
      {
        passage: 'Êxodo 38:8',
        summary: 'Resumo autoral: o bronze da bacia e de sua base provém dos espelhos das mulheres que serviam à entrada da tenda. O versículo não registra dimensões.',
      },
    ],
    theology:
      'Nesta abordagem adventista, a lavagem sacerdotal permite uma reflexão sobre purificação e reverência ao aproximar-se de Deus. Hebreus 9 distingue lavagens rituais da purificação da consciência realizada por Cristo, e Hebreus 10 convida à aproximação confiante. Relacionar a bacia à renovação espiritual é uma aplicação tipológica; os textos não a identificam diretamente com o batismo cristão. A água do modelo não possui poder espiritual, nem a lavagem substitui o sacrifício de Jesus.',
    theologyRefs: ['Hebreus 9:9–14', 'Hebreus 10:19–22'],
    reconstruction:
      'A forma arredondada, o pedestal, a profundidade e toda a escala visual da bacia são conjecturais. Êxodo 30 e 38 informam material, uso e posição relativa, não medidas. Nenhuma dimensão numérica é cadastrada como bíblica. Não utilizamos as medidas do grande reservatório do templo de Salomão para preencher essa lacuna.',
    certainty: 'Reconstrução aproximada',
  },
  {
    id: 'table',
    number: '04',
    name: 'Mesa dos pães',
    subtitle: 'Provisão e aliança',
    zone: 'Lugar Santo',
    description:
      'A mesa de acácia revestida de ouro ficava no lado norte do Lugar Santo, diante do candelabro. Sobre ela se dispunham doze pães, renovados a cada sábado. Levítico vincula essa apresentação à aliança e reserva os pães a Arão e seus filhos, para consumo em lugar santo, não aos visitantes.',
    materials: ['Madeira de acácia', 'Ouro puro'],
    dimensions: [
      { label: 'Comprimento', cubits: 2 },
      { label: 'Largura', cubits: 1 },
      { label: 'Altura', cubits: 1.5 },
    ],
    references: [
      {
        passage: 'Êxodo 25:23–30; 26:35',
        summary: 'Resumo autoral: a mesa mede dois por um côvado e um e meio de altura, recebe revestimento de ouro e é colocada ao norte, em frente ao candelabro.',
      },
      {
        passage: 'Levítico 24:5–9',
        summary: 'Resumo autoral: doze pães são organizados em dois conjuntos de seis, renovados no sábado e destinados ao consumo sacerdotal em lugar santo.',
      },
    ],
    theology:
      'A apresentação contínua dos pães, ligada à aliança em Levítico, sustenta uma reflexão adventista sobre dependência e comunhão com Deus. João 6 apresenta Jesus como aquele que dá vida e satisfaz a necessidade espiritual de quem crê. Aproximar esse ensino da mesa é uma aplicação tipológica: João não afirma que esteja interpretando esse móvel. O serviço sacerdotal e o alimento reservado têm contexto próprio, sem instituir neste texto a celebração cristã da Ceia.',
    theologyRefs: ['Levítico 24:5–9', 'João 6:35', 'Hebreus 9:2, 6'],
    reconstruction:
      'O volume principal preserva as medidas de Êxodo 25; a posição ao norte segue Êxodo 26. Formato dos pães, perfil das pernas e detalhes dos utensílios são aproximações. Os dois conjuntos de seis pães representam Levítico 24, sem pretensão de recuperar sua aparência exata. A câmera visita um espaço historicamente sacerdotal.',
    certainty: 'Medidas bíblicas',
  },
  {
    id: 'lampstand',
    number: '05',
    name: 'Candelabro',
    subtitle: 'Luz para o Lugar Santo',
    zone: 'Lugar Santo',
    description:
      'Feito de ouro puro trabalhado, o candelabro tinha uma haste central, seis braços laterais e sete lâmpadas, com ornamentação vegetal descrita em Êxodo. Ficava no lado sul do Lugar Santo, diante da mesa. O cuidado das lâmpadas integrava o serviço sacerdotal; não se tratava de um conjunto de velas modernas.',
    materials: ['Ouro puro', 'Azeite para as lâmpadas'],
    dimensions: [],
    references: [
      {
        passage: 'Êxodo 25:31–40; 26:35',
        summary: 'Resumo autoral: o candelabro de ouro tem seis braços laterais e sete lâmpadas, com cálices em forma de flor de amendoeira, e fica ao sul da tenda.',
      },
      {
        passage: 'Êxodo 27:20–21; 30:7–8',
        summary: 'Resumo autoral: o povo fornece azeite para a iluminação, e Arão e seus filhos cuidam das lâmpadas no serviço diante de Deus.',
      },
    ],
    theology:
      'Na leitura adventista proposta, a luz do candelabro oferece uma imagem didática para refletir sobre Cristo como luz da vida. João 8:12 fundamenta essa afirmação sobre Jesus, mas não declara que o candelabro do deserto seja seu referente direto. A relação é tipológica, não uma equivalência estabelecida por Êxodo. Evitamos transformar cada braço ou ornamento em código doutrinário; a confiança cristã repousa em Cristo, não em supostos poderes do objeto ou de sua luz.',
    theologyRefs: ['João 8:12', 'Hebreus 9:2, 6'],
    reconstruction:
      'Êxodo descreve braços, lâmpadas e ornamentos, mas não informa altura ou largura do candelabro. Curvatura, espaçamento e proporções são escolhas aproximadas da cena. Não copiamos um candelabro de templo posterior como prova do formato original. O brilho ilustra lâmpadas a azeite; não representa fisicamente a presença divina nem uma dimensão documentada.',
    certainty: 'Reconstrução aproximada',
  },
  {
    id: 'incense',
    number: '06',
    name: 'Altar de incenso',
    subtitle: 'O serviço diante do véu',
    zone: 'Lugar Santo',
    description:
      'O pequeno altar de acácia revestida de ouro ficava diante do véu. Arão queimava incenso pela manhã e ao entardecer, em conexão com o cuidado das lâmpadas. Diferente do altar do pátio, ele não recebia holocaustos; seu uso era regulado, incluindo a expiação anual de seus chifres com sangue.',
    materials: ['Madeira de acácia', 'Ouro puro', 'Incenso aromático'],
    dimensions: [
      { label: 'Comprimento', cubits: 1 },
      { label: 'Largura', cubits: 1 },
      { label: 'Altura', cubits: 2 },
    ],
    references: [
      {
        passage: 'Êxodo 30:1–10',
        summary: 'Resumo autoral: o altar de incenso mede um por um côvado e dois de altura, fica diante do véu e tem regras próprias para o incenso e a expiação anual.',
      },
      {
        passage: 'Apocalipse 8:3–4',
        summary: 'Resumo autoral: na visão de João, incenso acompanha as orações dos santos diante de Deus; a passagem não fornece uma planta do Tabernáculo do deserto.',
      },
    ],
    theology:
      'Apocalipse associa explicitamente incenso e orações numa visão celestial. Na perspectiva adventista, essa imagem auxilia a reflexão sobre oração e o ministério de Cristo em favor dos fiéis, fundamentado em Hebreus. A aplicação ao altar do deserto é tipológica; não identifica automaticamente cada personagem da visão com Jesus. Segundo a Crença Fundamental 24, sua intercessão comunica os benefícios do sacrifício único da cruz, e não significa uma nova oferta de sua vida.',
    theologyRefs: ['Apocalipse 8:3–4', 'Hebreus 9:24–28', confessionalSource.label],
    reconstruction:
      'As medidas e a posição diante do véu seguem Êxodo 30:1–6, nossa referência espacial para o deserto. Hebreus 9:4 relaciona o incenso ao compartimento interior em sua apresentação cultual; não o usamos para deslocar este altar contra Êxodo. Chifres, acabamento e fumaça são representações esquemáticas, sem escala bíblica para esses detalhes.',
    certainty: 'Medidas bíblicas',
  },
  {
    id: 'veil',
    number: '07',
    name: 'Véu',
    subtitle: 'Uma separação no interior',
    zone: 'Lugar Santo',
    description:
      'O véu de tecido colorido e linho, com querubins trabalhados, separava o Lugar Santo do Lugar Santíssimo. Era sustentado por quatro colunas revestidas de ouro. Além dele ficava a arca. O acesso não era cotidiano nem aberto a todos: o sumo sacerdote entrava no contexto anual do Dia da Expiação.',
    materials: ['Linho fino retorcido', 'Fios azuis, púrpura e escarlate', 'Acácia e ouro nas colunas', 'Prata nas bases'],
    dimensions: [],
    references: [
      {
        passage: 'Êxodo 26:31–35',
        summary: 'Resumo autoral: o véu com querubins divide os dois compartimentos, sustentado por quatro colunas sobre bases de prata; a arca fica no lado interior.',
      },
      {
        passage: 'Levítico 16:2–3, 12–17; Hebreus 9:6–7',
        summary: 'Resumo autoral: a entrada no compartimento interior é restrita ao sumo sacerdote no serviço anual, com preparação, incenso e sangue, não uma circulação livre.',
      },
    ],
    theology:
      'Hebreus 10:19–22 relaciona expressamente o acesso a Deus por Jesus à imagem do véu e à sua carne. Essa conexão do Novo Testamento é distinta das aplicações simbólicas propostas para outros móveis. A leitura adventista afirma a confiança nesse acesso por Cristo, sem apagar o contexto das restrições antigas. O véu virtual aberto é apenas um recurso de estudo; não representa mérito do visitante, nem descreve as divisões da arquitetura celestial com precisão demonstrável.',
    theologyRefs: ['Hebreus 9:6–12', 'Hebreus 10:19–22'],
    reconstruction:
      'Não cadastramos largura ou altura: Êxodo 26:31–35 não dá medidas próprias do véu. Sua escala é inferida para caber na tenda esquemática, não uma medida textual. Bordados, espessura e modo de abertura são aproximados. Ocultá-lo na visualização revela o interior para estudo e não elimina as restrições históricas de acesso.',
    certainty: 'Reconstrução aproximada',
  },
  {
    id: 'ark',
    number: '08',
    name: 'Arca da aliança',
    subtitle: 'Aliança e expiação',
    zone: 'Lugar Santíssimo',
    description:
      'A arca era um cofre de acácia revestido de ouro por dentro e por fora, destinado a receber o testemunho da aliança. Sua cobertura de ouro, o propiciatório, tinha dois querubins. Ficava além do véu, no Lugar Santíssimo, onde o sumo sacerdote realizava o serviço anual prescrito em Levítico 16.',
    materials: ['Madeira de acácia', 'Ouro puro'],
    dimensions: [
      { label: 'Comprimento da arca', cubits: 2.5 },
      { label: 'Largura da arca', cubits: 1.5 },
      { label: 'Altura da arca', cubits: 1.5 },
    ],
    references: [
      {
        passage: 'Êxodo 25:10–22; 26:33–34',
        summary: 'Resumo autoral: a arca mede dois e meio por um e meio côvados, com um e meio de altura; a cobertura de ouro tem querubins e fica no compartimento interior.',
      },
      {
        passage: 'Levítico 16:12–17',
        summary: 'Resumo autoral: no serviço de expiação, o sumo sacerdote leva incenso e sangue para além do véu; o rito trata das impurezas e transgressões do povo.',
      },
    ],
    theology:
      'Na perspectiva adventista, aliança e expiação ajudam a compreender a relação entre a santidade de Deus e sua graça. Hebreus 9 menciona a arca, mas desloca a atenção para o ministério superior de Cristo e seu próprio sangue. A Crença Fundamental 24 lê o Dia da Expiação como figura do juízo investigativo, sem tornar a arca fonte de salvação. Essa interpretação confessional é desenvolvida na síntese final, não deduzida das medidas do cofre.',
    theologyRefs: ['Hebreus 9:1–14, 24–28', 'Levítico 16', confessionalSource.label],
    reconstruction:
      'As medidas correspondem ao corpo da arca, não à altura total dos querubins. Seus rostos, asas e proporções não têm medidas detalhadas no texto e são aproximados. A cobertura segue a descrição de Êxodo 25. Eventual luz acima dela é recurso ilustrativo, não objeto físico bíblico nem reprodução comprovada do céu.',
    certainty: 'Medidas bíblicas',
  },
  {
    id: 'christ',
    number: '09',
    name: 'Cristo e o santuário',
    subtitle: 'Sacrifício único, intercessão presente',
    zone: 'Síntese',
    description:
      'Hebreus 8–10 apresenta Jesus como sumo sacerdote no santuário celestial e como aquele que ofereceu a própria vida uma vez por todas. Sua atuação em favor dos fiéis não repete o sacrifício da cruz. Esta etapa reúne o sentido cristológico do estudo; não acrescenta um móvel ou compartimento ao Tabernáculo.',
    materials: [],
    dimensions: [],
    references: [
      {
        passage: 'Hebreus 8:1–5',
        summary: 'Resumo autoral: Jesus ministra no santuário estabelecido por Deus; o serviço terrestre é apresentado como cópia e sombra, não como levantamento arquitetônico do céu.',
      },
      {
        passage: 'Hebreus 9:11–14, 24–28; 10:10–22',
        summary: 'Resumo autoral: Cristo se oferece uma única vez, comparece diante de Deus em nosso favor e fundamenta a aproximação confiante dos fiéis. Esses textos não mencionam o ano 1844.',
      },
      {
        passage: 'Daniel 8:14; 9:24–27',
        summary: 'Resumo autoral: Daniel 8 associa um período de 2.300 tardes e manhãs à restauração do santuário; Daniel 9 apresenta setenta semanas relativas ao povo e à cidade. A ligação cronológica com 1844 é interpretação adventista, não uma data escrita nessas passagens.',
      },
      {
        passage: 'Levítico 16',
        summary: 'Resumo autoral: o Dia da Expiação inclui a purificação do santuário e do povo. Sua aplicação ao ministério celestial pertence à interpretação teológica, não à descrição física do Tabernáculo.',
      },
    ],
    theology:
      'Segundo a Crença Fundamental 24, Cristo intercede desde a ascensão e iniciou em 1844 o juízo investigativo, fase final de seu ministério. A interpretação adventista relaciona os 2.300 dias de Daniel 8:14 às setenta semanas de 9:24–27 pelo princípio dia-ano, e lê Levítico 16 à luz de Hebreus 9. Não é consenso cristão: Hebreus não afirma 1844. O sacrifício permanece único e suficiente. Consulte a formulação confessional oficial para aprofundar essa leitura.',
    theologyRefs: ['Hebreus 8:1–5', 'Hebreus 9:11–28', 'Hebreus 10:10–22', 'Daniel 8:14', 'Daniel 9:24–27', 'Levítico 16', confessionalSource.label],
    reconstruction:
      'Esta etapa é uma síntese teológica, não um objeto arqueológico. Não atribuímos medidas ou materiais a Cristo nem modelamos o santuário celestial como duplicação física da tenda. O percurso reúne serviços de momentos e participantes diferentes para ensinar; não descreve um ritual único acessível a qualquer adorador. Texto ainda sujeito à revisão humana.',
    certainty: 'Síntese teológica',
  },
];

export const tourSteps: readonly ElementId[] = elementIds;

export function getElement(id: ElementId): SanctuaryElement {
  const element = elements.find((entry) => entry.id === id);

  if (!element) {
    throw new Error(`Elemento do santuário não encontrado: ${id}`);
  }

  return element;
}
