for language in bg_BG cs_CZ da_DK de_DE el_GR es_ES fr_FR hu_HU it_IT iw_IL ja_JP ko_KR nl_NL nn_NO pl_PL pt_PT ro_RO ru_RU sk_SK sr_RS sv_FI sv_SE tr_TR uk_UA zh_CN zh_TW; do
  rm -rf "languages/${language}"
  mkdir -p "languages/${language}"
  cp -R src/www/* "languages/${language}"
  rm -rf "languages/${language}/index.html"
  rm -rf "languages/${language}/home.html"
  rm -rf "languages/${language}/public"
  rm -rf "languages/${language}/webhooks"
  rm -rf "languages/${language}/api"
  find "languages/${language}" -type f -name "*.js" | xargs rm 
done
