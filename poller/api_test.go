package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_extractMaxPlayerCount(t *testing.T) {
	// return the right hand side as an int
	maxPlayers := extractMaxPlayerCount("16/60")
	assert.Equal(t, int64(60), maxPlayers)

	// if we can't parse, return 0
	maxPlayers = extractMaxPlayerCount("invalid")
	assert.Equal(t, int64(0), maxPlayers)
}

func Test_parseServerName(t *testing.T) {
	// Pulled from API 2024-04-03
	tests := []struct {
		Input  string
		Region string
		Name   string
	}{
		{
			"<span class=\"fi fi-au\"></span> [AU] Vigrid | BattleRoyale #6 - Max Trio - Vanilla",
			"AU",
			"Vigrid | BattleRoyale #6 - Max Trio - Vanilla",
		},
		{
			"<span class=\"fi fi-au\"></span> [AU] Vigrid | BattleRoyale #7 - Solo - Vanilla",
			"AU",
			"Vigrid | BattleRoyale #7 - Solo - Vanilla",
		},
		{
			"<span class=\"fi fi-ca\"></span> [NA] Vigrid | BattleRoyale #11 - Max Trio - Vanilla",
			"NA",
			"Vigrid | BattleRoyale #11 - Max Trio - Vanilla",
		},
		{
			"<span class=\"fi fi-ca\"></span> [NA] Vigrid | BattleRoyale #12 - Max Trio - Modded",
			"NA",
			"Vigrid | BattleRoyale #12 - Max Trio - Modded",
		},
		{
			"<span class=\"fi fi-ca\"></span> [NA] Vigrid | BattleRoyale #9 - Solo - Vanilla",
			"NA",
			"Vigrid | BattleRoyale #9 - Solo - Vanilla",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #1 - Solo - Modded",
			"EU",
			"Vigrid | BattleRoyale #1 - Solo - Modded",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #10 - Max Trio - Modded",
			"EU",
			"Vigrid | BattleRoyale #10 - Max Trio - Modded",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #13 - Takistan - Vanilla - Max Trio",
			"EU",
			"Vigrid | BattleRoyale #13 - Takistan - Vanilla - Max Trio",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #2 - Solo - Vanilla",
			"EU",
			"Vigrid | BattleRoyale #2 - Solo - Vanilla",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #3 - Max Trio - Vanilla #1",
			"EU",
			"Vigrid | BattleRoyale #3 - Max Trio - Vanilla #1",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #4 - Max Trio - Vanilla #2",
			"EU",
			"Vigrid | BattleRoyale #4 - Max Trio - Vanilla #2",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #5 - Max Duo - Vanilla",
			"EU",
			"Vigrid | BattleRoyale #5 - Max Duo - Vanilla",
		},
		{
			"<span class=\"fi fi-eu\"></span> [EU] Vigrid | BattleRoyale #8 - Max Duo - Modded",
			"EU",
			"Vigrid | BattleRoyale #8 - Max Duo - Modded",
		},
		// When offline, they do a different format for some reason
		{
			"<span class=\"fi fi-eu\"></span> BattleRoyale #10",
			"EU",
			"BattleRoyale #10",
		},
	}

	for _, test := range tests {
		region, name, err := parseServerName(test.Input)
		assert.NoError(t, err)
		assert.Equal(t, test.Region, region)
		assert.Equal(t, test.Name, name)
	}
}
