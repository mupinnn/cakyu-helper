{
  description = "Bun development environment";
  inputs = { nixpkgs.url = "github:NixOs/nixpkgs/release-25.11"; };
  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.bun pkgs.chromium pkgs.nodejs_22 ];
        shellHook = ''
          export PUPPETEER_SKIP_DOWNLOAD="1"
          export PUPPETEER_EXECUTABLE_PATH="${pkgs.chromium}/bin/chromium"
        '';
      };
    };
}
