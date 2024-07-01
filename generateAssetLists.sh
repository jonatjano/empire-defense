cd assets

DEBUG="$1"

DEFAULT_TEXTURE_PACK="devpack"
DEFAULT_LANGUAGE="en"

addFeature() {
	featureName=$1
	default=$2
	path=$3

	currentPath=$(pwd)
	cd "$path"

	if [[ ! -z $DEBUG ]]; then
		echo -n "\n\t\"$featureName\":{\n\t\t\"default\":\"$default\",\n\t\t\"list\":["
	else
		echo -n "\"$featureName\":{\"default\":\"$default\",\"list\":["
	fi
	for file in *; do
		if [[ ! -z $DEBUG ]]; then
			echo -n "\n\t\t\t"
		fi
		file=$(echo "$file" | cut -d'.' -f 1)
		if [[ -z $i ]]; then
			echo -n "\"$file\""
		else
			echo -n ",\"$file\""
		fi
		i="$i+"
	done
	if [[ ! -z $DEBUG ]]; then
		echo -n "\n\t\t]\n\t}"
	else
		echo -n "]}"
	fi

	cd "$currentPath"
}


result="{"
result="$result$(addFeature "texturePacks" $DEFAULT_TEXTURE_PACK images),"
result="$result$(addFeature "languages" $DEFAULT_LANGUAGE translations)"
if [[ ! -z $DEBUG ]]; then
	result="$result,\n\"debug\":true}"
else
	result="$result}"
fi
echo -e "$result" > meta.json
