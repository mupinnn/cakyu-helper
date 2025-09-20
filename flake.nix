{
  description = "Bun development environment";
  inputs = { nixpkgs.url = "github:NixOs/nixpkgs/release-25.05"; };
  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.bun pkgs.chromium pkgs.nodejs_22 ];

        PUPPETEER_SKIP_DOWNLOAD = "1";
        PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
      };
    };
}
