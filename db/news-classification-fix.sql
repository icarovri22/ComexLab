-- Correct automatic categories affected by substring matches in export/import/report.
UPDATE public.comexlab_news AS n SET category=v.category,impact=v.impact,updated_at=NOW() FROM (VALUES
('8','regulamentacao','Alterações regulatórias podem exigir novas licenças, documentos ou procedimentos aduaneiros. Confira as normas oficialmente vigentes.'),
('68','regulamentacao','Alterações regulatórias podem exigir novas licenças, documentos ou procedimentos aduaneiros. Confira as normas oficialmente vigentes.'),
('65','economia','Indicadores econômicos e cambiais podem influenciar demanda, preços e planejamento de importações e exportações.'),
('5','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('38','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('36','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('35','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('33','acordos','Acordos comerciais podem modificar condições de acesso a mercados e preferências tarifárias, conforme sua entrada em vigor e regras de origem.'),
('32','economia','Indicadores econômicos e cambiais podem influenciar demanda, preços e planejamento de importações e exportações.'),
('31','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('30','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('25','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('24','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('22','economia','Indicadores econômicos e cambiais podem influenciar demanda, preços e planejamento de importações e exportações.'),
('17','regulamentacao','Alterações regulatórias podem exigir novas licenças, documentos ou procedimentos aduaneiros. Confira as normas oficialmente vigentes.'),
('13','regulamentacao','Alterações regulatórias podem exigir novas licenças, documentos ou procedimentos aduaneiros. Confira as normas oficialmente vigentes.'),
('105','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('103','geral','Acompanhe possíveis efeitos sobre mercados, fornecedores e oportunidades comerciais. Consulte a fonte original para decisões operacionais.'),
('1','acordos','Acordos comerciais podem modificar condições de acesso a mercados e preferências tarifárias, conforme sua entrada em vigor e regras de origem.')
) AS v(id,category,impact) WHERE n.id=v.id::bigint AND n.category='logistica' AND n.is_manual=false AND n.updated_by IS NULL;
