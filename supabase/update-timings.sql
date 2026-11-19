-- Mise à jour des chronos (25–30 s selon la difficulté ; votes 3 et 4 inchangés)
-- À exécuter une fois dans Supabase > SQL Editor. Ne supprime aucune donnée.
update public.steps set time_limit = 25 where idx in (0, 1, 5, 6, 7, 9, 11, 12, 15, 21);
update public.steps set time_limit = 28 where idx in (13, 17, 18, 22, 23, 24);
update public.steps set time_limit = 30 where idx in (10, 14, 16, 19, 20, 25);
update public.steps set body = '17 questions sur toute la norme, appliquée à l''affaire Maersk. 25 à 30 secondes chacune, classement dévoilé à la fin. La dernière compte double.' where idx = 8;
select idx, time_limit from public.steps order by idx;
