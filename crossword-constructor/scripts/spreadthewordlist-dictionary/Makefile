#
# Build Spread the Word List as a macOS .dictionary bundle.
#
# Requires Apple's Dictionary Development Kit:
#   git clone https://github.com/SebastianSzturo/Dictionary-Development-Kit.git
#   export DICT_BUILD_TOOL_DIR="/path/to/Dictionary Development Kit"
#

DICT_NAME		=	"Spread the Word List"
DICT_SRC_PATH		=	SpreadTheWordList.xml
CSS_PATH		=	SpreadTheWordList.css
PLIST_PATH		=	MyInfo.plist

DICT_BUILD_OPTS		=	-c 1

DICT_BUILD_TOOL_DIR	?=	"/Applications/Utilities/Dictionary Development Kit"
DICT_BUILD_TOOL_BIN	=	"$(DICT_BUILD_TOOL_DIR)/bin"

DICT_DEV_KIT_OBJ_DIR	=	./objects
export	DICT_DEV_KIT_OBJ_DIR

DESTINATION_FOLDER	=	~/Library/Dictionaries
RM			=	/bin/rm

.PHONY: all install clean xml

xml:
	python3 convert.py "$(SOURCE)" -o $(DICT_SRC_PATH)

all: $(DICT_SRC_PATH)
	"$(DICT_BUILD_TOOL_BIN)/build_dict.sh" $(DICT_BUILD_OPTS) $(DICT_NAME) $(DICT_SRC_PATH) $(CSS_PATH) $(PLIST_PATH)
	echo "Done."

install: all
	echo "Installing into $(DESTINATION_FOLDER)."
	mkdir -p $(DESTINATION_FOLDER)
	ditto --noextattr --norsrc $(DICT_DEV_KIT_OBJ_DIR)/$(DICT_NAME).dictionary  $(DESTINATION_FOLDER)/$(DICT_NAME).dictionary
	touch $(DESTINATION_FOLDER)
	echo "Done."

clean:
	$(RM) -rf $(DICT_DEV_KIT_OBJ_DIR) $(DICT_SRC_PATH)
